import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPARK_PASSWORD = process.env.SPARK_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!SPARK_PASSWORD) {
      return NextResponse.json({ success: false, error: "Server not configured" }, { status: 500 });
    }

    if (password === SPARK_PASSWORD) {
      // Set auth cookie
      const response = NextResponse.json({ success: true });
      response.cookies.set("spark_auth", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ success: false, error: "Invalid passcode" }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}