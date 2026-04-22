import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { CompositionProps } from "../../types/constants";

export type LocalRenderState =
  | { status: "init" }
  | { status: "bundling" }
  | { status: "rendering"; progress: number }
  | { status: "error"; error: Error }
  | { status: "done"; renderId: string; size: number };

export const useLocalRendering = (
  inputProps: z.infer<typeof CompositionProps>,
) => {
  const [state, setState] = useState<LocalRenderState>({ status: "init" });

  const renderLocal = useCallback(async () => {
    setState({ status: "bundling" });

    try {
      const response = await fetch("/api/local/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputProps }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          switch (data.type) {
            case "status":
              setState({ status: "bundling" });
              break;
            case "progress":
              setState({ status: "rendering", progress: data.progress });
              break;
            case "done":
              setState({
                status: "done",
                renderId: data.renderId,
                size: data.size,
              });
              break;
            case "error":
              setState({ status: "error", error: new Error(data.message) });
              break;
          }
        }
      }
    } catch (err) {
      setState({ status: "error", error: err as Error });
    }
  }, [inputProps]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  return useMemo(
    () => ({ renderLocal, state, undo }),
    [renderLocal, state, undo],
  );
};
