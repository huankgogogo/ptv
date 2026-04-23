import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  renderVideo,
  isRenderingSupported,
  type RenderOptions,
  type RenderResult,
} from "../lib/client-renderer";

export type ClientRenderState =
  | { status: "init" }
  | { status: "rendering"; progress: number; statusMessage: string }
  | { status: "error"; error: Error }
  | { status: "done"; blob: Blob; mimeType: string };

interface UseClientRenderOptions {
  component: ComponentType | null;
  composition: {
    fps: number;
    durationInFrames: number;
    width: number;
    height: number;
  };
  inputProps: Record<string, unknown>;
}

export function useClientRender(options: UseClientRenderOptions) {
  const { component, composition, inputProps } = options;
  const [state, setState] = useState<ClientRenderState>({ status: "init" });
  const abortControllerRef = useRef<AbortController | null>(null);

  const startRender = useCallback(async () => {
    if (!component) {
      setState({
        status: "error",
        error: new Error("Component not ready"),
      });
      return;
    }

    const support = isRenderingSupported();
    if (!support.supported) {
      setState({
        status: "error",
        error: new Error(support.reason || "Rendering not supported"),
      });
      return;
    }

    abortControllerRef.current = new AbortController();

    setState({
      status: "rendering",
      progress: 0,
      statusMessage: "Initializing...",
    });

    try {
      const renderOptions: RenderOptions = {
        composition: {
          component,
          ...composition,
        },
        inputProps,
        signal: abortControllerRef.current.signal,
        onProgress: (progress) => {
          setState((prev) => {
            if (prev.status === "rendering") {
              return {
                ...prev,
                progress,
              };
            }
            return prev;
          });
        },
        onStatus: (statusMessage) => {
          setState((prev) => {
            if (prev.status === "rendering") {
              return {
                ...prev,
                statusMessage,
              };
            }
            return prev;
          });
        },
      };

      const result: RenderResult = await renderVideo(renderOptions);

      if (abortControllerRef.current?.signal.aborted) {
        setState({ status: "init" });
        return;
      }

      setState({
        status: "done",
        blob: result.blob,
        mimeType: result.mimeType,
      });
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        setState({ status: "init" });
        return;
      }

      setState({
        status: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [component, composition, inputProps]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({ status: "init" });
  }, []);

  const reset = useCallback(() => {
    setState({ status: "init" });
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return useMemo(
    () => ({
      state,
      startRender,
      cancel,
      reset,
      isSupported: isRenderingSupported().supported,
    }),
    [state, startRender, cancel, reset],
  );
}
