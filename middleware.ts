import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCorsHeaders } from "@/lib/cors";

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }

  const response = NextResponse.next();
  const corsHeaders = getCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
