import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Default middleware configuration for UI testing
// All routes are allowed without authentication or restrictions
export function middleware(request: NextRequest) {
  // Allow all routes for UI testing
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes for UI testing
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
