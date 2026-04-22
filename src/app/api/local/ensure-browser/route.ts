import { ensureBrowser } from "@remotion/renderer";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
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
        await ensureBrowser({
          onBrowserDownload: () => ({
            version: null,
            onProgress: ({ alreadyAvailable, percent, downloadedBytes, totalSizeInBytes }) => {
              if (alreadyAvailable) {
                send({ type: "already-available" });
                return;
              }
              send({ type: "progress", percent, downloadedBytes, totalSizeInBytes });
            },
          }),
        });

        send({ type: "done" });
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
