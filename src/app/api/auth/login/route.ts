import { randomBytes } from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { jsonRateLimitError } from "@/lib/api-error";
import { createOAuthStateCookieValue, OAUTH_STATE_MAX_AGE_SECONDS } from "@/lib/oauth-state";
import { consumeRouteRateLimit } from "@/lib/rate-limit-policy";
import { getSecondMeConfig } from "@/lib/secondme-config";

export async function GET(request: Request) {
  const rateLimit = consumeRouteRateLimit("authLogin", request);

  if (!rateLimit.allowed) {
    return jsonRateLimitError(rateLimit);
  }

  const config = getSecondMeConfig();
  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set("oauth_state", createOAuthStateCookieValue(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    state,
    scope: [
      "user.info",
      "user.info.shades",
      "user.info.softmemory",
      "chat",
      "note.add",
      "voice",
    ].join(" "),
  });

  redirect(`${config.oauthUrl}?${params.toString()}`);
}
