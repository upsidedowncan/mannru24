import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCorsHeaders } from "@/lib/cors";

export function proxy(request: NextRequest) {
  // Check if it's an API route
  if (request.nextUrl.pathname.startsWith("/api")) {
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(request),
      });
    }

    // For other requests, continue and add CORS headers to the response
    const response = NextResponse.next();
    const corsHeaders = getCorsHeaders(request);

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  return NextResponse.next();
}

// Match all API routes
export const config = {
  matcher: "/api/:path*",
};
