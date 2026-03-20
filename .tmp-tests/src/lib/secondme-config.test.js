"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const secondme_config_1 = require("./secondme-config");
strict_1.default.throws(() => (0, secondme_config_1.getSecondMeConfig)({
    NEXT_PUBLIC_SECONDME_API_URL: "https://api.second.me",
    NEXT_PUBLIC_SECONDME_OAUTH_URL: "https://second.me/oauth2/authorize",
    SECONDME_CLIENT_SECRET: "secret",
    SECONDME_CALLBACK_URL: "http://localhost:3000/api/auth/callback",
}), /SECONDME_CLIENT_ID/);
const config = (0, secondme_config_1.getSecondMeConfig)({
    SECONDME_CLIENT_ID: "client-id",
    SECONDME_CLIENT_SECRET: "secret",
    SECONDME_CALLBACK_URL: "http://localhost:3000/api/auth/callback",
});
strict_1.default.equal(config.apiUrl, "https://api.mindverse.com/gate/lab/api/secondme");
strict_1.default.equal(config.oauthUrl, "https://go.second.me/oauth/");
