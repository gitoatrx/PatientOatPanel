import { NextRequest, NextResponse } from "next/server";

// Simple rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  // Rate limiting
  const clientIP =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  const now = Date.now();
  const clientRateLimit = rateLimit.get(clientIP);

  if (clientRateLimit) {
    if (now > clientRateLimit.resetTime) {
      // Reset rate limit
      rateLimit.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (clientRateLimit.count >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        {
          status: "ERROR",
          predictions: [],
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 },
      );
    } else {
      // Increment count
      clientRateLimit.count++;
    }
  } else {
    // First request from this IP
    rateLimit.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        status: "ERROR",
        predictions: [],
        error: "API key not configured",
      },
      { status: 500 },
    );
  }

  if (!query) {
    return NextResponse.json(
      {
        status: "ERROR",
        predictions: [],
        error: "Query parameter required",
      },
      { status: 400 },
    );
  }

  // Validate query length
  if (query.length < 2) {
    return NextResponse.json(
      {
        status: "ERROR",
        predictions: [],
        error: "Query must be at least 2 characters long",
      },
      { status: 400 },
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&components=country:ca&location=53.7267,-127.6476&radius=1000000&key=${apiKey}`;

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Places API error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          status: "ERROR",
          predictions: [],
          error: "Request timeout",
        },
        { status: 408 },
      );
    }

    return NextResponse.json(
      {
        status: "ERROR",
        predictions: [],
        error: `Failed to fetch places: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
