import { getTweet } from "react-tweet/api";
import { NextResponse } from "next/server";

export const revalidate = 3600; // cache 1 hour

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const tweet = await getTweet(id);
    if (!tweet) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(tweet);
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
