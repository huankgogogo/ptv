import { renderMediaOnWeb } from "@remotion/web-renderer";
import type { ComponentType } from "react";

export interface RenderOptions {
  composition: {
    component: ComponentType;
    fps: number;
    durationInFrames: number;
    width: number;
    height: number;
  };
  inputProps: Record<string, unknown>;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  onStatus?: (message: string) => void;
}

export interface RenderResult {
  blob: Blob;
  mimeType: string;
}

function getSupportedCodec(): "vp8" | "vp9" | null {
  const codecs: Array<"vp9" | "vp8"> = ["vp9", "vp8"];

  for (const codec of codecs) {
    try {
      const mimeType = `video/webm;codecs=${codec}`;
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return codec;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function isRenderingSupported(): {
  supported: boolean;
  reason?: string;
} {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Not in browser environment" };
  }

  if (!window.VideoEncoder) {
    return {
      supported: false,
      reason: "WebCodecs API not supported (Chrome 94+, Edge 94+, Firefox 130+ required)",
    };
  }

  const codec = getSupportedCodec();
  if (!codec) {
    return { supported: false, reason: "No supported video codecs (VP8/VP9)" };
  }

  return { supported: true };
}

export async function renderVideo(
  options: RenderOptions,
): Promise<RenderResult> {
  const { composition, inputProps, onProgress, onStatus, signal } = options;

  onStatus?.("Checking browser support...");
  const support = isRenderingSupported();
  if (!support.supported) {
    throw new Error(support.reason || "Rendering not supported");
  }

  const codec = getSupportedCodec();
  if (!codec) {
    throw new Error("No supported video codec found");
  }

  onStatus?.("Starting render...");

  try {
    const result = await renderMediaOnWeb({
      composition: {
        id: "client-render",
        component: composition.component,
        durationInFrames: composition.durationInFrames,
        fps: composition.fps,
        width: composition.width,
        height: composition.height,
      },
      videoCodec: codec,
      audioCodec: "opus",
      inputProps,
      videoBitrate: "high",
      audioBitrate: "medium",
      muted: false,
      signal,
      onProgress: (progressData) => {
        onProgress?.(progressData.progress);
        onStatus?.(
          `Rendering: ${(progressData.progress * 100).toFixed(1)}%`,
        );
      },
    });

    onStatus?.("Creating video file...");
    const blob = await result.getBlob();

    return {
      blob,
      mimeType: "video/webm",
    };
  } catch (error) {
    if (signal?.aborted) {
      throw new Error("Render cancelled");
    }
    throw error;
  }
}
