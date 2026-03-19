import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTED_TOKEN_PREFIX = "enc:v1:";
const TOKEN_ENCRYPTION_ALGORITHM = "aes-256-gcm";
const TOKEN_ENCRYPTION_IV_BYTES = 12;

type EnvSource = Record<string, string | undefined>;

function getTokenEncryptionSecret(env: EnvSource = process.env) {
  const direct = env.TOKEN_ENCRYPTION_KEY?.trim();
  if (direct) {
    return direct;
  }

  const fallback = env.SECONDME_CLIENT_SECRET?.trim();
  if (fallback) {
    return fallback;
  }

  throw new Error(
    "Missing token encryption secret. Configure TOKEN_ENCRYPTION_KEY or SECONDME_CLIENT_SECRET.",
  );
}

function deriveTokenEncryptionKey(env: EnvSource = process.env) {
  return createHash("sha256").update(getTokenEncryptionSecret(env)).digest();
}

export function isEncryptedToken(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith(ENCRYPTED_TOKEN_PREFIX);
}

export function encryptTokenForStorage(token: string, env: EnvSource = process.env) {
  const iv = randomBytes(TOKEN_ENCRYPTION_IV_BYTES);
  const cipher = createCipheriv(TOKEN_ENCRYPTION_ALGORITHM, deriveTokenEncryptionKey(env), iv);

  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_TOKEN_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function normalizeTokenForStorage(token: string | null | undefined, env: EnvSource = process.env) {
  if (!token) {
    return null;
  }

  if (isEncryptedToken(token)) {
    return token;
  }

  return encryptTokenForStorage(token, env);
}

export function decryptStoredToken(value: string, env: EnvSource = process.env) {
  if (!isEncryptedToken(value)) {
    return value;
  }

  const payload = value.slice(ENCRYPTED_TOKEN_PREFIX.length);
  const parts = payload.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token payload");
  }

  const [ivBase64, tagBase64, encryptedBase64] = parts;

  try {
    const decipher = createDecipheriv(
      TOKEN_ENCRYPTION_ALGORITHM,
      deriveTokenEncryptionKey(env),
      Buffer.from(ivBase64, "base64"),
    );

    decipher.setAuthTag(Buffer.from(tagBase64, "base64"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedBase64, "base64")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    throw new Error("Invalid encrypted token payload");
  }
}
