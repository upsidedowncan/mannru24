import { NextResponse } from "next/server";
import { readDb, writeDb, logClick } from "@/lib/db";
import { login } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();

    const db = readDb();
    const user = db.users.find((u) => u.name === name);

    if (!user) {
      return NextResponse.json({ error: "User not found", code: "USER_NOT_FOUND" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "Ваш аккаунт забанен администрацией коалиции MANNHAXORS", code: "BANNED" }, { status: 403 });
    }

    await login({ id: user.id, name: user.name });
    logClick(db, user.id, "Вход в систему");
    writeDb(db);

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
