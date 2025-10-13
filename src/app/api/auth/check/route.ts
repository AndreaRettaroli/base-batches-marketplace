import { type NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/services/database.service";
import type { UserProfile } from "@/types";

export async function GET(request: NextRequest) {
  const fid = request.headers.get("x-user-fid");
  const userId = request.headers.get("x-user-id");

  if (!(fid && userId)) {
    return NextResponse.json({ status: "nok" }, { status: 200 });
  }

  let dbUser: UserProfile | null = null;
  if (fid) {
    if (Number.isNaN(Number(fid))) {
      return NextResponse.json({ status: "nok" }, { status: 200 });
    }
    dbUser = await DatabaseService.getUserByFarcasterFid(Number(fid));
  }
  if (userId) {
    dbUser = await DatabaseService.getUser(userId);
  }

  if (!dbUser) {
    return NextResponse.json({ status: "nok" }, { status: 200 });
  }

  return NextResponse.json({ status: "ok", user: dbUser }, { status: 200 });
}
