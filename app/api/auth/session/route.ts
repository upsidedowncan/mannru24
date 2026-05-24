import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ user: null });
    }

    const db = readDb();
    const user = db.users.find(u => u.id === session.user.id);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Return extended session info for ecosystem services
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        level: user.level,
        bonusBalance: user.bonusBalance,
        phone: user.phone
      },
      expires: session.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "authenticated"
    });
  } catch (error) {
    console.error("Session API Error:", error);
    return NextResponse.json({ user: null, error: "Internal session error" });
  }
}
