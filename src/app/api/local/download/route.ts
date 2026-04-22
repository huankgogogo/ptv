import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { localRenderStore } from "../../../../lib/local-render-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const render = localRenderStore.get(id);
  if (!render) {
    return NextResponse.json(
      { error: "Render not found or expired" },
      { status: 404 },
    );
  }

  const buffer = fs.readFileSync(render.filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": 'attachment; filename="video.mp4"',
      "Content-Length": render.size.toString(),
    },
  });
}
