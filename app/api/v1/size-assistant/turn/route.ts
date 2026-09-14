import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { type Locale } from "@/lib/catalog";
import { getCatalogProducts } from "@/lib/catalog-store";
import {
  calculateSizeRecommendation,
  getMeasurementDefinition,
  getSizeGuide,
  nextQuestion,
  toCentimetres,
  toKilograms,
  type FitPreference,
  type SizingSessionState,
} from "@/lib/sizing";
import { extractSizingData, fallbackExtraction } from "@/lib/sizing-agent";
import { getRuntimeOpenAIKey } from "@/lib/openai-key-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  productId: z.string(),
  locale: z.enum(["en", "ar"]).default("en"),
  message: z.string().trim().max(500),
  state: z.object({
    unit: z.enum(["cm", "in"]).nullable(),
    weightUnit: z.enum(["kg", "lb"]).nullable().default(null),
    measurements: z.record(z.string(), z.number()).default({}),
    fitPreference: z.enum(["snug", "regular", "relaxed"]).nullable(),
    pendingMeasurement: z
      .enum([
        "height",
        "weight",
        "chest",
        "bust",
        "underbust",
        "waist",
        "hips",
        "inseam",
      ])
      .nullable(),
  }),
});

const buckets = new Map<string, { count: number; reset: number }>();
function rateLimited(req: NextRequest) {
  const key =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 30;
}
const tr = (locale: Locale, en: string, ar: string) =>
  locale === "ar" ? ar : en;

function resultMessage(
  locale: Locale,
  recommendation: ReturnType<typeof calculateSizeRecommendation>,
  preference: FitPreference | null,
) {
  if (recommendation.status === "cannot_recommend")
    return tr(
      locale,
      `${recommendation.reasons[0]} I won't guess—use the full size guide or message our team.`,
      `${recommendation.reasons[0]} لن أخمّن—راجع دليل المقاسات الكامل أو تواصل مع فريقنا.`,
    );
  const alt = recommendation.alternateSize
    ? tr(
        locale,
        ` You're close to ${recommendation.alternateSize}; choose it if you prefer a ${preference === "snug" ? "roomier" : "closer"} fit.`,
        ` أنت قريب أيضاً من ${recommendation.alternateSize}؛ اختره إذا كنت تفضل ملاءمة ${preference === "snug" ? "أوسع" : "أكثر إحكاماً"}.`,
      )
    : "";
  return tr(
    locale,
    `Your best match is ${recommendation.recommendedSize}. ${recommendation.reasons.join(" ")}${alt}`,
    `أنسب مقاس لك هو ${recommendation.recommendedSize}. ${recommendation.reasons.join(" ")}${alt}`,
  );
}

export async function POST(req: NextRequest) {
  const products = await getCatalogProducts();
  const requestId = crypto.randomUUID();
  if (rateLimited(req))
    return NextResponse.json(
      {
        code: "RATE_LIMITED",
        message: "Too many sizing requests. Please wait a moment.",
        requestId,
      },
      { status: 429 },
    );
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        code: "INVALID_REQUEST",
        message: "Invalid sizing request",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
        requestId,
      },
      { status: 400 },
    );
  const { productId, locale, message } = parsed.data;
  const product = products.find((item) => item.id === productId);
  if (!product)
    return NextResponse.json(
      { code: "PRODUCT_NOT_FOUND", message: "Product not found", requestId },
      { status: 404 },
    );
  const guide = getSizeGuide(product);
  const state = parsed.data.state as SizingSessionState;
  if (guide.fit === "one-size") {
    const recommendation = calculateSizeRecommendation(
      product,
      guide,
      {},
      "regular",
      locale,
    );
    return NextResponse.json({
      message: resultMessage(locale, recommendation, null),
      state,
      recommendation,
      quickReplies: [],
      agentMode: "deterministic",
    });
  }

  let extraction = fallbackExtraction(message, state);
  let agentMode: "ai" | "deterministic" = "deterministic";
  const apiKey = await getRuntimeOpenAIKey();
  const needsLanguageUnderstanding =
    Boolean(apiKey) &&
    ((/[a-zA-Z\u0600-\u06FF]/.test(message) &&
      !/^\s*(centimetres?|inches?|سنتيمتر|بوصة)\s*$/i.test(message)) ||
      (message.match(/\d+(?:\.\d+)?/g) || []).length > 1);
  if (needsLanguageUnderstanding) {
    try {
      extraction = await extractSizingData({ product, locale, message, state, apiKey: apiKey! });
      agentMode = "ai";
    } catch (error) {
      console.error(
        "Sizing agent fallback",
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }
  if (extraction.unrelated)
    return NextResponse.json({
      message: tr(
        locale,
        "I can only help with fit and sizing for this product. Let's continue with your height and weight.",
        "يمكنني المساعدة فقط في ملاءمة ومقاس هذا المنتج. لنكمل بطولك ووزنك.",
      ),
      state,
      quickReplies: [],
      agentMode,
    });

  const nextState: SizingSessionState = {
    unit: extraction.unit || state.unit,
    weightUnit: extraction.weightUnit || state.weightUnit,
    measurements: { ...state.measurements },
    fitPreference: extraction.fitPreference || state.fitPreference,
    pendingMeasurement: state.pendingMeasurement,
  };
  if (extraction.height != null) {
    const unit = nextState.unit || "cm";
    nextState.unit = unit;
    const cm = toCentimetres(extraction.height, unit);
    const def = getMeasurementDefinition(guide, "height")!;
    if (cm < def.plausible[0] || cm > def.plausible[1])
      return NextResponse.json({
        message: tr(
          locale,
          `${extraction.height} ${unit} looks unusual for height. Please check the number and unit.`,
          `${extraction.height} ${unit} يبدو غير معتاد للطول. يرجى التحقق من الرقم والوحدة.`,
        ),
        state: { ...nextState, pendingMeasurement: "height" },
        quickReplies: [],
        agentMode,
        validationError: "height",
      });
    nextState.measurements.height = cm;
  }
  if (extraction.weight != null) {
    const unit = nextState.weightUnit || "kg";
    nextState.weightUnit = unit;
    const kg = toKilograms(extraction.weight, unit);
    const def = getMeasurementDefinition(guide, "weight")!;
    if (kg < def.plausible[0] || kg > def.plausible[1])
      return NextResponse.json({
        message: tr(
          locale,
          `${extraction.weight} ${unit} looks unusual for weight. Please check the number and unit.`,
          `${extraction.weight} ${unit} يبدو غير معتاد للوزن. يرجى التحقق من الرقم والوحدة.`,
        ),
        state: { ...nextState, pendingMeasurement: "weight" },
        quickReplies: [],
        agentMode,
        validationError: "weight",
      });
    nextState.measurements.weight = kg;
  }
  const question = nextQuestion(guide, nextState, locale);
  nextState.pendingMeasurement = question.pending;
  if (question.pending)
    return NextResponse.json({
      message: question.message,
      state: nextState,
      quickReplies: question.quickReplies,
      agentMode,
    });
  const recommendation = calculateSizeRecommendation(
    product,
    guide,
    nextState.measurements,
    nextState.fitPreference || "regular",
    locale,
  );
  return NextResponse.json({
    message: resultMessage(locale, recommendation, nextState.fitPreference),
    state: nextState,
    recommendation,
    quickReplies: [],
    agentMode,
  });
}
