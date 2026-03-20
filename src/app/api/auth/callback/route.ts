import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { setSessionCookie } from "@/lib/auth-session";
import { validateOAuthStateCookieValue } from "@/lib/oauth-state";
import { buildProfilePayload, type JsonValue } from "@/lib/user-memory";
import { upsertMemorySnapshot } from "@/lib/memory-snapshot";
import { prisma } from "@/lib/prisma";
import { getSecondMeConfig } from "@/lib/secondme-config";
import { normalizeTokenForStorage } from "@/lib/token-crypto";

const TOKEN_URL = "https://api.mindverse.com/gate/lab/api/oauth/token/code";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // 详细调试日志
  console.log("=== OAuth Callback Debug ===");
  console.log("Full URL:", url.href);
  console.log("Code:", code ? "present" : "MISSING");
  console.log("State:", state ? "present" : "MISSING");
  console.log("Error:", error || "none");
  console.log("All params:", Object.fromEntries(searchParams.entries()));

  if (error) {
    console.error("OAuth error from SecondMe:", error);
    return redirect(`/?error=${encodeURIComponent(error)}`);
  }

  const cookieStore = await cookies();
  const stateValidation = validateOAuthStateCookieValue({
    expectedState: state,
    cookieValue: cookieStore.get("oauth_state")?.value,
  });

  if (!stateValidation.ok) {
    cookieStore.delete("oauth_state");
    return redirect(`/?error=${encodeURIComponent(stateValidation.error)}`);
  }

  cookieStore.delete("oauth_state");

  if (!code) {
    return redirect(`/?error=${encodeURIComponent("NO_CODE_PROVIDED")}`);
  }

  const config = getSecondMeConfig();

  try {
    // ========== Step 1: Token 交换 ==========
    console.log("Step 1: Exchanging code for token...");
    console.log("Token URL:", TOKEN_URL);
    console.log("Callback URL:", config.callbackUrl);
    console.log("Client ID:", config.clientId);
    console.log("API URL:", config.apiUrl);

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.callbackUrl,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    console.log("Step 1 result: status =", tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token error:", errorText);
      throw new Error("Failed to get access token");
    }

    const tokenResult = await tokenResponse.json();
    console.log("Step 1 result: code =", tokenResult.code);

    if (tokenResult.code !== 0) {
      throw new Error(tokenResult.message || "Token exchange failed");
    }

    const tokenData = tokenResult.data;
    const accessToken = tokenData.accessToken;
    const refreshToken = tokenData.refreshToken;
    const expiresIn = tokenData.expiresIn || 7200;

    // ========== Step 2: 获取用户信息 ==========
    console.log("Step 2: Fetching user info from:", `${config.apiUrl}/user/info`);

    const userResponse = await fetch(`${config.apiUrl}/user/info`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("Step 2 result: status =", userResponse.status);

    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userResult = await userResponse.json();
    const userData = userResult.code === 0 ? userResult.data : userResult;
    const secondMeId = userData.id || userData.userId;

    if (!secondMeId) {
      throw new Error("No user ID in response");
    }

    console.log("Step 2: secondMeId =", secondMeId);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // ========== Step 3: 数据库操作 ==========
    console.log("Step 3: Database operation, secondMeId =", secondMeId);

    let user = await prisma.user.findUnique({
      where: { secondMeId },
      include: {
        profiles: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    const storedAccessToken = normalizeTokenForStorage(accessToken) || "";
    const storedRefreshToken = refreshToken
      ? normalizeTokenForStorage(refreshToken)
      : normalizeTokenForStorage(user?.refreshToken);

    if (user) {
      user = await prisma.user.update({
        where: { secondMeId },
        data: {
          accessToken: storedAccessToken,
          ...(storedRefreshToken ? { refreshToken: storedRefreshToken } : {}),
          tokenExpires: expiresAt,
        },
        include: {
          profiles: {
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          secondMeId,
          accessToken: storedAccessToken,
          ...(storedRefreshToken ? { refreshToken: storedRefreshToken } : {}),
          tokenExpires: expiresAt,
        },
        include: {
          profiles: {
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      });
    }

    console.log("Step 3 result: user.id =", user.id);

    // ========== Step 4: 获取记忆信息 ==========
    console.log("Step 4: Fetching memory data...");

    try {
      const [shadesResponse, softMemoryResponse] = await Promise.all([
        fetch(`${config.apiUrl}/user/info/shades`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => null),
        fetch(`${config.apiUrl}/user/info/softmemory`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => null),
      ]);

      const shadesData = shadesResponse?.ok
        ? ((await shadesResponse.json()) as { code?: number; data?: unknown })
        : null;
      const softMemoryData = softMemoryResponse?.ok
        ? ((await softMemoryResponse.json()) as { code?: number; data?: unknown })
        : null;

      const shades = (shadesData?.code === 0 ? shadesData.data : shadesData) || {};
      const softMemory = (softMemoryData?.code === 0 ? softMemoryData.data : softMemoryData) || {};

      const profileData = buildProfilePayload({
        secondMeId,
        displayName: userData.nickname || userData.name,
        bio: userData.bio,
        avatar: userData.avatar,
        shades: shades as JsonValue,
        softMemory: softMemory as JsonValue,
      });

      // 更新或创建 Profile
      if (user.profiles.length > 0) {
        await prisma.profile.update({
          where: { id: user.profiles[0].id },
          data: {
            displayName: profileData.displayName,
            bio: profileData.bio,
            shades: JSON.stringify(profileData.shades),
            softMemory: JSON.stringify(profileData.softMemory),
            avatar: profileData.avatar,
          },
        });
      } else {
        await prisma.profile.create({
          data: {
            userId: user.id,
            displayName: profileData.displayName,
            bio: profileData.bio,
            shades: JSON.stringify(profileData.shades),
            softMemory: JSON.stringify(profileData.softMemory),
            avatar: profileData.avatar,
          },
        });
      }

      // 创建记忆快照 - 修复 NOT NULL 问题
      await upsertMemorySnapshot({
        userId: user.id,
        secondMeId,
        summary: profileData.memorySummary || "",
        highlights: profileData.memoryHighlights || [],
        rawSoftMemory: profileData.softMemory || {},
        rawShades: profileData.shades || {},
      });

      console.log("Step 4: Memory snapshot created successfully");
    } catch (memoryError) {
      console.error("Step 4 FAILED: Failed to initialize user memory:", memoryError);
    }

    console.log("Step 4 done (continuing to set session...)");

    // ========== Step 5: 设置 session ==========
    console.log("Step 5: Setting session cookie for user.id =", user.id);

    try {
      await setSessionCookie(user.id);
      console.log("Step 5: Session cookie set successfully");
    } catch (sessionError) {
      console.error("Step 5 FAILED: setSessionCookie error:", sessionError);
      throw sessionError;
    }

    console.log("Step 5 done, redirecting to /dashboard");
    redirect("/dashboard");
  } catch (caughtError: unknown) {
    if (
      caughtError &&
      typeof caughtError === "object" &&
      "digest" in caughtError &&
      typeof caughtError.digest === "string" &&
      caughtError.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw caughtError;
    }

    console.error("Auth callback error:", caughtError);
    return redirect(`/?error=${encodeURIComponent("AUTHENTICATION_FAILED")}`);
  }
}
