import assert from "node:assert/strict";

import { getSecondMeConfig } from "./secondme-config";

assert.throws(
  () =>
    getSecondMeConfig({
      NEXT_PUBLIC_SECONDME_API_URL: "https://api.second.me",
      NEXT_PUBLIC_SECONDME_OAUTH_URL: "https://second.me/oauth2/authorize",
      SECONDME_CLIENT_SECRET: "secret",
      SECONDME_CALLBACK_URL: "http://localhost:3000/api/auth/callback",
    }),
  /SECONDME_CLIENT_ID/,
);

const config = getSecondMeConfig({
  SECONDME_CLIENT_ID: "client-id",
  SECONDME_CLIENT_SECRET: "secret",
  SECONDME_CALLBACK_URL: "http://localhost:3000/api/auth/callback",
});

assert.equal(config.apiUrl, "https://api.mindverse.com/gate/lab/api/secondme");
assert.equal(config.oauthUrl, "https://go.second.me/oauth/");
