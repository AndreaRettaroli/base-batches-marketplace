import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "./lib/env";

export const config = {
  matcher: ["/api/:path*"],
};

export default async function middleware(req: NextRequest) {
  // Skip auth check for this endpoints
  if (
    req.nextUrl.pathname === "/api/auth/sign-in" ||
    req.nextUrl.pathname.includes("/api/og") ||
    req.nextUrl.pathname.includes("/api/webhook/farcaster") ||
    req.nextUrl.pathname.includes("/api/analyze") ||
    req.nextUrl.pathname.includes("/api/chat") ||
    req.nextUrl.pathname.includes("/api/health") ||
    req.nextUrl.pathname.includes("/api/listings") ||
    req.nextUrl.pathname.includes("/api/session")
  ) {
    return NextResponse.next();
  }

  // Get token from auth_token cookie set in auth/sign-in route
  const authToken = req.cookies.get("auth_token")?.value;

  if (!authToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    // Verify the token using jose
    const { payload } = await jwtVerify(authToken, secret);

    // Clone the request headers to add user info
    const requestHeaders = new Headers(req.headers);
    if (payload.fid !== null && payload.fid !== undefined) {
      requestHeaders.set("x-user-fid", payload.fid as string);
    }
    // Always set user id if it exists
    if (payload.userId) {
      requestHeaders.set("x-user-id", payload.userId as string);
    }

    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error(error);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.delete("x-user-fid");
    requestHeaders.delete("x-user-id");

    return NextResponse.json(
      { error: "Invalid token" },
      {
        status: 401,
        headers: requestHeaders,
      }
    );
  }
}
