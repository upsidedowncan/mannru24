import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { login } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, password, phone } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
    }

    const db = readDb();
    if (db.users.find((u) => u.name === name)) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name,
      passwordHash,
      phone: phone || "",
      bonusBalance: 1000,
      totalEarned: 1000,
      totalSpent: 0,
      streak: 1,
      level: 1,
      xp: 0,
      clickHistory: [],
    };

    db.users.push(newUser);

    // Add default card for new user
    db.cards.push({
      id: uuidv4(),
      userId: newUser.id,
      tier: "bronze",
      number: `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
      holder: name.toUpperCase(),
      balance: 1000,
      expiry: "12/29",
      createdAt: new Date().toISOString(),
    });

    writeDb(db);
    await login({ id: newUser.id, name: newUser.name });

    return NextResponse.json({ success: true, user: { id: newUser.id, name: newUser.name } });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
