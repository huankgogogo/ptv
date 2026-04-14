"use client";

import { ErrorDisplay } from "@/components/ErrorDisplay";
import { Button } from "@/components/ui/button";
import { captureFrame } from "@/helpers/capture-frame";
import { useImageAttachments } from "@/hooks/useImageAttachments";
import { ArrowUp, Camera, Link, Loader2, Paperclip, X } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";

interface ChatInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  isLoading: boolean;
  onSubmit: (attachedImages?: string[], urlContent?: string) => void;
  // Frame capture props
  Component?: ComponentType | null;
  fps?: number;
  durationInFrames?: number;
  currentFrame?: number;
}

export function ChatInput({
  prompt,
  onPromptChange,
  isLoading,
  onSubmit,
  Component,
  fps = 30,
  durationInFrames = 150,
  currentFrame = 0,
}: ChatInputProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchedUrl, setFetchedUrl] = useState<{ url: string; content: string; title: string } | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const {
    attachedImages,
    isDragging,
    fileInputRef,
    addImages,
    removeImage,
    clearImages,
    handleFileSelect,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    canAddMore,
    error,
    clearError,
  } = useImageAttachments();

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Focus URL input when shown
  useEffect(() => {
    if (showUrlInput) {
      urlInputRef.current?.focus();
    }
  }, [showUrlInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit(
      attachedImages.length > 0 ? attachedImages : undefined,
      fetchedUrl?.content,
    );
    clearImages();
    setFetchedUrl(null);
    setUrlInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCapture = async () => {
    if (!Component || isCapturing || !canAddMore) return;

    setIsCapturing(true);
    try {
      const base64 = await captureFrame(Component, currentFrame, {
        width: 1920,
        height: 1080,
        fps,
        durationInFrames,
      });
      addImages([base64]);
    } catch (error) {
      console.error("Failed to capture frame:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFetchUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;

    setIsFetchingUrl(true);
    setUrlError(null);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch URL");
      setFetchedUrl({ url, content: data.content, title: data.title || url });
      setShowUrlInput(false);
      setUrlInput("");
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Failed to fetch URL");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFetchUrl();
    }
    if (e.key === "Escape") {
      setShowUrlInput(false);
      setUrlInput("");
      setUrlError(null);
    }
  };

  const canCapture = Component && !isLoading && !isCapturing && canAddMore;

  return (
    <div className="px-4 pt-4 pb-4">
      <form onSubmit={handleSubmit}>
        <div
          className={`bg-background-elevated rounded-xl border p-3 transition-colors ${
            isDragging ? "border-blue-500 bg-blue-500/10" : "border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Error message */}
          {error && (
            <ErrorDisplay
              error={error}
              variant="inline"
              size="sm"
              onDismiss={clearError}
              className="mb-2 py-2"
            />
          )}

          {/* Image previews */}
          {attachedImages.length > 0 && (
            <div className="mb-2">
              <div className="flex gap-2 overflow-x-auto pb-1 pt-2">
                {attachedImages.map((img, index) => (
                  <div key={index} className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Attached ${index + 1}`}
                      className="h-16 w-16 rounded border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground-dim mt-1">
                Images for reference only, they cannot be embedded in the
                animation
              </p>
            </div>
          )}

          {/* Fetched URL badge */}
          {fetchedUrl && (
            <div className="mb-2 flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg px-2 py-1">
              <Link className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="text-[11px] text-blue-300 truncate flex-1">
                {fetchedUrl.title || fetchedUrl.url}
              </span>
              <button
                type="button"
                onClick={() => setFetchedUrl(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* URL input inline */}
          {showUrlInput && (
            <div className="mb-2">
              <div className="flex gap-1.5 items-center">
                <input
                  ref={urlInputRef}
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={handleUrlKeyDown}
                  placeholder="https://example.com"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground-dim focus:outline-none border-b border-border pb-0.5"
                  disabled={isFetchingUrl}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim() || isFetchingUrl}
                  className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  {isFetchingUrl ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Fetch"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => { setShowUrlInput(false); setUrlError(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {urlError && (
                <p className="text-[10px] text-destructive mt-1">{urlError}</p>
              )}
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isDragging
                ? "Drop images here..."
                : "Tune your animation... (paste or drop images)"
            }
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground-dim focus:outline-none resize-none text-sm min-h-9 max-h-30"
            style={{ fieldSizing: "content" } as React.CSSProperties}
            disabled={isLoading}
          />
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex justify-end items-center mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || !canAddMore}
                className="text-muted-foreground hover:text-foreground h-7 w-7"
                title="Attach images"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowUrlInput((v) => !v)}
                disabled={isLoading}
                className={`h-7 w-7 ${fetchedUrl ? "text-blue-400" : "text-muted-foreground hover:text-foreground"}`}
                title="Attach URL"
              >
                <Link className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!canCapture}
                onClick={handleCapture}
                className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
                title="Use current frame of Preview as image in chat"
              >
                <Camera className="w-3.5 h-3.5 mr-1" />
                Use Frame
              </Button>

              <Button
                type="submit"
                size="icon-sm"
                disabled={!prompt.trim() || isLoading}
                loading={isLoading}
                className="bg-foreground text-background hover:bg-gray-200 h-7 w-7 ml-1"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
