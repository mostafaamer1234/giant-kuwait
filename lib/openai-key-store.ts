import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { del, get, put } from "@vercel/blob";

const SECRET_PATH = "giant/openai-api-key.json";

type EncryptedOpenAIKey = {
  version: 1;
  iv: string;
  tag: string;
  ciphertext: string;
  lastFour: string;
  updatedAt: string;
};

let localSecret: EncryptedOpenAIKey | undefined;

function encryptionKey() {
  const secret =
    process.env.OPENAI_KEY_ENCRYPTION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.OPENAI_API_KEY ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "giant-local-openai-key-encryption-change-me");
  if (!secret)
    throw new Error(
      "OPENAI_KEY_ENCRYPTION_SECRET or ADMIN_SESSION_SECRET is required",
    );
  return createHash("sha256").update(secret).digest();
}

function encrypt(apiKey: string): EncryptedOpenAIKey {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  return {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    lastFour: apiKey.slice(-4),
    updatedAt: new Date().toISOString(),
  };
}

function decrypt(value: EncryptedOpenAIKey) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(value.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

async function readOverride(): Promise<EncryptedOpenAIKey | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return localSecret || null;
  try {
    const result = await get(SECRET_PATH, { access: "private", useCache: false });
    if (!result || result.statusCode === 304 || !result.stream) return null;
    return (await new Response(result.stream).json()) as EncryptedOpenAIKey;
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) return null;
    throw error;
  }
}

export async function getOpenAIKeyStatus() {
  const override = await readOverride();
  if (override)
    return {
      configured: true,
      source: "admin" as const,
      lastFour: override.lastFour,
      updatedAt: override.updatedAt,
    };
  const environmentKey = process.env.OPENAI_API_KEY;
  return {
    configured: Boolean(environmentKey),
    source: environmentKey ? ("environment" as const) : ("none" as const),
    lastFour: environmentKey ? environmentKey.slice(-4) : null,
    updatedAt: null,
  };
}

export async function getRuntimeOpenAIKey() {
  const override = await readOverride();
  return override ? decrypt(override) : process.env.OPENAI_API_KEY || null;
}

export async function saveOpenAIKey(apiKey: string) {
  const encrypted = encrypt(apiKey);
  if (!process.env.BLOB_READ_WRITE_TOKEN) localSecret = encrypted;
  else
    await put(SECRET_PATH, JSON.stringify(encrypted), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  return getOpenAIKeyStatus();
}

export async function removeOpenAIKeyOverride() {
  localSecret = undefined;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(SECRET_PATH);
    } catch (error) {
      if (!(error instanceof Error && /not found/i.test(error.message))) throw error;
    }
  }
  return getOpenAIKeyStatus();
}
