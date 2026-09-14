import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const startTime = Date.now();
    // Verifikasi koneksi SQLite database
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "ok",
        app: "siapTKA",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: "connected",
          latencyMs: dbLatencyMs,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Health Check Error]:", error);
    return NextResponse.json(
      {
        status: "error",
        app: "siapTKA",
        timestamp: new Date().toISOString(),
        error: error?.message || "Database connection failed",
      },
      { status: 500 }
    );
  }
}
