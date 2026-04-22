import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import crypto from "crypto";
import fs from "fs";
import { NextRequest } from "next/server";
import os from "os";
import path from "path";
import { COMP_NAME } from "../../../../../types/constants";
import { localRenderStore } from "../../../../lib/local-render-store";

export const runtime = "nodejs";
export const maxDuration = 600;

// Cache the bundle to avoid re-bundling on every render
let bundleCache: string | null = null;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { inputProps } = body;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // Stream may be closed
        }
      };

      try {
        send({ type: "status", message: "Ensuring browser..." });

        await ensureBrowser({
          onBrowserDownload: () => ({
            version: null,
            onProgress: ({ alreadyAvailable, percent, downloadedBytes, totalSizeInBytes }) => {
              if (!alreadyAvailable) {
                send({ type: "browser-download", percent, downloadedBytes, totalSizeInBytes });
              }
            },
          }),
        });

        send({ type: "status", message: "Bundling..." });

        if (!bundleCache) {
          bundleCache = await bundle({
            entryPoint: path.join(process.cwd(), "src/remotion/index.ts"),
          });
        }

        send({ type: "status", message: "Selecting composition..." });

        const comp = await selectComposition({
          serveUrl: bundleCache,
          id: COMP_NAME,
          inputProps,
        });

        const renderId = crypto.randomUUID();
        const outputPath = path.join(
          os.tmpdir(),
          `remotion-${renderId}.mp4`,
        );

        await renderMedia({
          composition: comp,
          serveUrl: bundleCache,
          codec: "h264",
          outputLocation: outputPath,
          inputProps,
          onProgress: ({ progress }) => {
            send({
              type: "progress",
              progress: Math.round(progress * 100) / 100,
            });
          },
        });

        const stat = fs.statSync(outputPath);
        localRenderStore.set(renderId, {
          filePath: outputPath,
          size: stat.size,
        });

        // Auto-cleanup after 10 minutes
        setTimeout(
          () => {
            localRenderStore.delete(renderId);
            try {
              fs.unlinkSync(outputPath);
            } catch {}
          },
          10 * 60 * 1000,
        );

        send({ type: "done", renderId, size: stat.size });
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
