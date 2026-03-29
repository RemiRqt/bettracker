import { NextRequest, NextResponse } from "next/server";

const SOFASCORE_CDN = "https://api.sofascore.app/api/v1";

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("teamId");
  const type = request.nextUrl.searchParams.get("type") ?? "team";

  if (!teamId) {
    return NextResponse.json({ error: "teamId requis" }, { status: 400 });
  }

  const url =
    type === "tournament"
      ? `${SOFASCORE_CDN}/unique-tournament/${teamId}/image`
      : `${SOFASCORE_CDN}/team/${teamId}/image`;

  try {
    const res = await fetch(url);

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
