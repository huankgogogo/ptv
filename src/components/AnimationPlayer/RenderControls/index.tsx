"use client";

import { Button } from "@/components/ui/button";
import { Download, HardDrive } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { useLocalRendering } from "../../../helpers/use-local-rendering";
import { useRendering } from "../../../helpers/use-rendering";
import { useClientRender } from "../../../hooks/useClientRender";
import { DownloadButton } from "./DownloadButton";
import { ErrorComp } from "./Error";
import { ProgressBar } from "./ProgressBar";

export const RenderControls: React.FC<{
  code: string;
  durationInFrames: number;
  fps: number;
  component: ComponentType | null;
}> = ({ code, durationInFrames, fps, component }) => {
  const { renderMedia, state, undo } = useRendering({
    code,
    durationInFrames,
    fps,
  });
  const {
    renderLocal,
    state: localState,
    undo: localUndo,
  } = useLocalRendering({ code, durationInFrames, fps });

  const {
    state: clientState,
    startRender: startClientRender,
    reset: resetClientRender,
    isSupported: isClientRenderSupported,
  } = useClientRender({
    component,
    composition: {
      fps,
      durationInFrames,
      width: 1920,
      height: 1080,
    },
    inputProps: { code },
  });

  const previousPropsRef = useRef({ code, durationInFrames, fps });

  useEffect(() => {
    const prev = previousPropsRef.current;
    const hasChanged =
      prev.code !== code ||
      prev.durationInFrames !== durationInFrames ||
      prev.fps !== fps;

    if (hasChanged) {
      if (state.status !== "init") undo();
      if (localState.status !== "init") localUndo();
      if (clientState.status !== "init") resetClientRender();
    }
    previousPropsRef.current = { code, durationInFrames, fps };
  }, [code, durationInFrames, fps, state.status, undo, localState.status, localUndo, clientState.status, resetClientRender]);

  useEffect(() => {
    if (localState.status === "done") {
      const a = document.createElement("a");
      a.href = `/api/local/download?id=${localState.renderId}`;
      a.download = "video.mp4";
      a.click();
    }
  }, [localState]);

  useEffect(() => {
    if (clientState.status === "done") {
      const url = URL.createObjectURL(clientState.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "video.webm";
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [clientState]);

  const isLocalActive =
    localState.status === "bundling" || localState.status === "rendering";
  const isCloudActive =
    state.status === "invoking" || state.status === "rendering";
  const isClientActive = clientState.status === "rendering";

  if (state.status === "rendering") {
    return <ProgressBar progress={state.progress} />;
  }

  if (state.status === "done") {
    return <DownloadButton state={state} undo={undo} />;
  }

  if (localState.status === "bundling") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
        Bundling...
      </div>
    );
  }

  if (localState.status === "rendering") {
    return <ProgressBar progress={localState.progress} />;
  }

  if (localState.status === "done") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={localUndo}>
          <UndoIcon />
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const a = document.createElement("a");
            a.href = `/api/local/download?id=${localState.renderId}`;
            a.download = "video.mp4";
            a.click();
          }}
        >
          <HardDrive className="w-4 h-4 mr-2" />
          Download local video
        </Button>
      </div>
    );
  }

  if (clientState.status === "rendering") {
    return (
      <div className="flex flex-col gap-2 w-full">
        <ProgressBar progress={clientState.progress} />
        <div className="text-xs text-muted-foreground text-center">
          {clientState.statusMessage}
        </div>
      </div>
    );
  }

  if (clientState.status === "done") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={resetClientRender}>
          <UndoIcon />
        </Button>
        <div className="text-sm text-muted-foreground">
          Video downloaded successfully
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          disabled={isCloudActive || isLocalActive || isClientActive || !code}
          loading={state.status === "invoking"}
          onClick={renderMedia}
        >
          <Download className="w-4 h-4 mr-2" />
          {state.status === "invoking" ? "Starting render..." : "Render & Download"}
        </Button>
        <Button
          variant="secondary"
          disabled={isCloudActive || isLocalActive || isClientActive || !code}
          onClick={renderLocal}
        >
          <HardDrive className="w-4 h-4 mr-2" />
          Export Locally
        </Button>
        {isClientRenderSupported && component && (
          <Button
            variant="secondary"
            disabled={isCloudActive || isLocalActive || isClientActive || !code}
            onClick={startClientRender}
          >
            <Download className="w-4 h-4 mr-2" />
            Browser Export
          </Button>
        )}
      </div>
      {state.status === "error" && (
        <ErrorComp message={state.error.message} />
      )}
      {localState.status === "error" && (
        <ErrorComp message={localState.error.message} />
      )}
      {clientState.status === "error" && (
        <ErrorComp message={clientState.error.message} />
      )}
    </div>
  );
};

const UndoIcon: React.FC = () => {
  return (
    <svg height="1em" viewBox="0 0 512 512">
      <path
        fill="var(--foreground)"
        d="M48.5 224H40c-13.3 0-24-10.7-24-24V72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2L98.6 96.6c87.6-86.5 228.7-86.2 315.8 1c87.5 87.5 87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3c-62.2-62.2-162.7-62.5-225.3-1L185 183c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8H48.5z"
      />
    </svg>
  );
};
