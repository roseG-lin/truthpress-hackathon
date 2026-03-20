"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEncryptedToken = isEncryptedToken;
exports.encryptTokenForStorage = encryptTokenForStorage;
exports.normalizeTokenForStorage = normalizeTokenForStorage;
exports.decryptStoredToken = decryptStoredToken;
const node_crypto_1 = require("node:crypto");
const ENCRYPTED_TOKEN_PREFIX = "enc:v1:";
const TOKEN_ENCRYPTION_ALGORITHM = "aes-256-gcm";
const TOKEN_ENCRYPTION_IV_BYTES = 12;
function getTokenEncryptionSecret(env = process.env) {
    const direct = env.TOKEN_ENCRYPTION_KEY?.trim();
    if (direct) {
        return direct;
    }
    const fallback = env.SECONDME_CLIENT_SECRET?.trim();
    if (fallback) {
        return fallback;
    }
    throw new Error("Missing token encryption secret. Configure TOKEN_ENCRYPTION_KEY or SECONDME_CLIENT_SECRET.");
}
function deriveTokenEncryptionKey(env = process.env) {
    return (0, node_crypto_1.createHash)("sha256").update(getTokenEncryptionSecret(env)).digest();
}
function isEncryptedToken(value) {
    return typeof value === "string" && value.startsWith(ENCRYPTED_TOKEN_PREFIX);
}
function encryptTokenForStorage(token, env = process.env) {
    const iv = (0, node_crypto_1.randomBytes)(TOKEN_ENCRYPTION_IV_BYTES);
    const cipher = (0, node_crypto_1.createCipheriv)(TOKEN_ENCRYPTION_ALGORITHM, deriveTokenEncryptionKey(env), iv);
    const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${ENCRYPTED_TOKEN_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}
function normalizeTokenForStorage(token, env = process.env) {
    if (!token) {
        return null;
    }
    if (isEncryptedToken(token)) {
        return token;
    }
    return encryptTokenForStorage(token, env);
}
function decryptStoredToken(value, env = process.env) {
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
        const decipher = (0, node_crypto_1.createDecipheriv)(TOKEN_ENCRYPTION_ALGORITHM, deriveTokenEncryptionKey(env), Buffer.from(ivBase64, "base64"));
        decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedBase64, "base64")),
            decipher.final(),
        ]);
        return decrypted.toString("utf8");
    }
    catch {
        throw new Error("Invalid encrypted token payload");
    }
}
