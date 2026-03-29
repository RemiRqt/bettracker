import { NextRequest, NextResponse } from "next/server";

const SPORTAPI_BASE = "https://sportapi7.p.rapidapi.com/api/v1";

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("teamId");
  const type = request.nextUrl.searchParams.get("type") ?? "team";

  if (!teamId) {
    return NextResponse.json({ error: "teamId requis" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return new NextResponse(null, { status: 500 });
  }

  const url =
    type === "tournament"
      ? `${SPORTAPI_BASE}/unique-tournament/${teamId}/image`
      : `${SPORTAPI_BASE}/team/${teamId}/image`;

  try {
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-host": "sportapi7.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    if (!res.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
