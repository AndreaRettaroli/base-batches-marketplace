import { createClient, Errors } from "@farcaster/quick-auth";
import { SignJWT } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { fetchUserFromNeynar } from "@/lib/neynar";
import { DatabaseService } from "@/services/database.service";

const quickAuthClient = createClient();

export const POST = async (req: NextRequest) => {
  const {
    token: farcasterToken,
    fid: contextFid,
    referrerFid,
  } = await req.json();
  if (!(farcasterToken && contextFid) || Number.isNaN(Number(contextFid))) {
    return NextResponse.json(
      { success: false, error: "Invalid arguments" },
      { status: 400 }
    );
  }

  // Verify signature matches custody address and auth address
  try {
    const payload = await quickAuthClient.verifyJwt({
      domain: new URL(env.NEXT_PUBLIC_URL).hostname,
      token: farcasterToken,
    });
    const fid = payload.sub;
    if (!(payload && fid) || Number.isNaN(Number(fid)) || fid !== contextFid) {
      console.error("Invalid token for fid", fid, "contextFid", contextFid);
      return NextResponse.json(
        { success: false, error: "Invalid" },
        { status: 401 }
      );
    }

    let dbUser = await DatabaseService.getUserByFarcasterFid(fid);
    if (!dbUser) {
      const userFromNeynar = await fetchUserFromNeynar(fid.toString());
      if (!userFromNeynar) {
        console.error("FID not found in Neynar", fid, referrerFid);
        throw new Error("Farcaster user not found in Neynar");
      }
      dbUser = await DatabaseService.createFarcasterUser({
        farcasterFid: fid,
        farcasterNotificationDetails: undefined,
        email: `${fid}@farcaster.emails`,
        name: userFromNeynar.username,
        avatar: userFromNeynar.pfp_url ?? undefined,
      });
    }
    if (!dbUser) {
      throw new Error("Failed to create user");
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const monthInMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    const exp = payload.exp
      ? new Date(Number(payload.exp) * 1000 + monthInMs)
      : new Date(Date.now() + monthInMs);

    const token = await new SignJWT({
      fid,
      userId: dbUser.id,
      timestamp: Date.now(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(secret);

    const response = NextResponse.json(
      { success: true, user: dbUser },
      { status: 200 }
    );

    // Set the auth cookie with the JWT token
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: false, // currently not working in frames,
      secure: true,
      sameSite: "none",
      maxAge: monthInMs / 1000, // 30 days in seconds
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("Sign-in error:", e);
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    throw e;
  }
};
