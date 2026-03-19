import { NextResponse } from "next/server";

import { getSessionPayload } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionPayload();

  return NextResponse.json({
    authenticated: Boolean(session),
    session,
  });
}
