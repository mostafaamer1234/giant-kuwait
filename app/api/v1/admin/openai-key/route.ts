import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, validAdminCredentials } from "@/lib/admin-auth";
import {
  getOpenAIKeyStatus,
  removeOpenAIKeyOverride,
  saveOpenAIKey,
} from "@/lib/openai-key-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Update = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20)
    .max(500)
    .regex(/^sk-[A-Za-z0-9_-]+$/, "Enter a valid OpenAI API key"),
  currentPassword: z.string().min(1).max(200),
});
const Remove = z.object({ currentPassword: z.string().min(1).max(200) });
const sameOrigin = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
};

export async function GET() {
  if (!(await getAdminSession()))
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sign in required" },
      { status: 401 },
    );
  return NextResponse.json({ data: await getOpenAIKeyStatus() });
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sign in required" },
      { status: 401 },
    );
  if (!sameOrigin(request))
    return NextResponse.json(
      { code: "INVALID_ORIGIN", message: "Invalid request origin" },
      { status: 403 },
    );
  const parsed = Update.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        code: "INVALID_REQUEST",
        message: "Check the API key and current password",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  if (!(await validAdminCredentials(session.email, parsed.data.currentPassword)))
    return NextResponse.json(
      { code: "INVALID_PASSWORD", message: "Current password is incorrect" },
      { status: 401 },
    );
  return NextResponse.json({ data: await saveOpenAIKey(parsed.data.apiKey) });
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sign in required" },
      { status: 401 },
    );
  if (!sameOrigin(request))
    return NextResponse.json(
      { code: "INVALID_ORIGIN", message: "Invalid request origin" },
      { status: 403 },
    );
  const parsed = Remove.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { code: "INVALID_REQUEST", message: "Current password is required" },
      { status: 400 },
    );
  if (!(await validAdminCredentials(session.email, parsed.data.currentPassword)))
    return NextResponse.json(
      { code: "INVALID_PASSWORD", message: "Current password is incorrect" },
      { status: 401 },
    );
  return NextResponse.json({ data: await removeOpenAIKeyOverride() });
}
