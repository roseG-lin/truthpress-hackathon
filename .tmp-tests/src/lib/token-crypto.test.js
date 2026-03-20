"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const token_crypto_1 = require("./token-crypto");
const env = {
    TOKEN_ENCRYPTION_KEY: "test-token-encryption-key",
};
const encrypted = (0, token_crypto_1.encryptTokenForStorage)("access-token-123", env);
strict_1.default.equal((0, token_crypto_1.isEncryptedToken)(encrypted), true);
strict_1.default.notEqual(encrypted, "access-token-123");
strict_1.default.equal((0, token_crypto_1.decryptStoredToken)(encrypted, env), "access-token-123");
strict_1.default.equal((0, token_crypto_1.decryptStoredToken)("legacy-plaintext-token", env), "legacy-plaintext-token");
strict_1.default.throws(() => (0, token_crypto_1.decryptStoredToken)("enc:v1:broken", env), /Invalid encrypted token payload/);
