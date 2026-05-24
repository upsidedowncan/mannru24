import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.JWT_SECRET || "fallback_secret_only_for_dev";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any, expiry: string = "24h") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(user: { id: string; name: string }) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  (await cookies()).set("session", session, { expires, httpOnly: true, secure: true });
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (e) {
    return null;
  }
}

export type BearerAuthResult =
  | { ok: true; userId: string; scopes: string[] }
  | { ok: false; error: string; status: 401 | 403 };

/**
 * Resolves a Bearer token from the Authorization header and verifies the
 * required OAuth scope.  Returns null when no token is present (caller should
 * fall back to cookie session).  Returns an error result when the token is
 * present but invalid, expired, or lacks the required scope.
 */
export async function resolveBearerAuth(
  req: Request,
  requiredScope: string
): Promise<BearerAuthResult | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return null;

  let payload: any;
  try {
    payload = await decrypt(token);
  } catch {
    return { ok: false, error: "Invalid or expired token", status: 401 };
  }

  if (!Array.isArray(payload.scopes) || !payload.scopes.includes(requiredScope)) {
    return { ok: false, error: "Insufficient scope", status: 403 };
  }

  return { ok: true, userId: payload.user.id, scopes: payload.scopes };
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}
