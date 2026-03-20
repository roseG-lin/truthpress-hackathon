import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, string> = {};

  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "AppSession" CASCADE;`);
    results.AppSession = "deleted";
  } catch (e: unknown) {
    results.AppSession = (e as Error).message;
  }

  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "MemorySnapshot" CASCADE;`);
    results.MemorySnapshot = "deleted";
  } catch (e: unknown) {
    results.MemorySnapshot = (e as Error).message;
  }

  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ContentHistory" CASCADE;`);
    results.ContentHistory = "deleted";
  } catch (e: unknown) {
    results.ContentHistory = (e as Error).message;
  }

  return NextResponse.json({
    status: "cleanup_done",
    results,
    message: "旧表已删除，重新部署后会自动创建新表"
  });
}
