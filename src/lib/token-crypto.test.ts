import assert from "node:assert/strict";

import {
  decryptStoredToken,
  encryptTokenForStorage,
  isEncryptedToken,
} from "./token-crypto";

const env = {
  TOKEN_ENCRYPTION_KEY: "test-token-encryption-key",
};

const encrypted = encryptTokenForStorage("access-token-123", env);

assert.equal(isEncryptedToken(encrypted), true);
assert.notEqual(encrypted, "access-token-123");
assert.equal(decryptStoredToken(encrypted, env), "access-token-123");

assert.equal(decryptStoredToken("legacy-plaintext-token", env), "legacy-plaintext-token");

assert.throws(
  () => decryptStoredToken("enc:v1:broken", env),
  /Invalid encrypted token payload/,
);
