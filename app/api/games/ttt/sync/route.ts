import { NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const state = await decrypt(token);
    return NextResponse.json({ board: state.board });
  } catch (e) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
}
