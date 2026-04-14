"use client";

import { ErrorDisplay } from "@/components/ErrorDisplay";
import { Button } from "@/components/ui/button";
import { examplePrompts } from "@/examples/prompts";
import { useImageAttachments } from "@/hooks/useImageAttachments";
import {
  ArrowUp,
  BarChart3,
  Disc,
  Hash,
  Link,
  Loader2,
  MessageCircle,
  Paperclip,
  SquareArrowOutUpRight,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import NextLink from "next/link";
import { useEffect, useRef, useState } from "react";

const iconMap: Record<string, LucideIcon> = {
  Type,
  MessageCircle,
  Hash,
  BarChart3,
  Disc,
};

interface LandingPageInputProps {
  onNavigate: (prompt: string, attachedImages?: string[], urlContent?: string) => void;
  isNavigating?: boolean;
  showCodeExamplesLink?: boolean;
}

export function LandingPageInput({
  onNavigate,
  isNavigating = false,
  showCodeExamplesLink = false,
}: LandingPageInputProps) {
  const [prompt, setPrompt] = useState("");
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
    removeImage,
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
    if (showUrlInput) urlInputRef.current?.focus();
  }, [showUrlInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isNavigating) return;
    onNavigate(
      prompt,
      attachedImages.length > 0 ? attachedImages : undefined,
      fetchedUrl?.content,
    );
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
    if (e.key === "Enter") { e.preventDefault(); handleFetchUrl(); }
    if (e.key === "Escape") { setShowUrlInput(false); setUrlInput(""); setUrlError(null); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (Shift+Enter for new line)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4">
      <h1 className="text-5xl font-bold text-white mb-10 text-center">
        What do you want to create?
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-3xl">
        <div
          className={`bg-background-elevated rounded-xl border p-4 transition-colors ${
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
              size="md"
              onDismiss={clearError}
              className="mb-3"
            />
          )}

          {/* Image previews */}
          {attachedImages.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 pt-2">
              {attachedImages.map((img, index) => (
                <div key={index} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Attached ${index + 1}`}
                    className="h-20 w-auto rounded border border-border object-cover"
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
          )}

          {/* Fetched URL badge */}
          {fetchedUrl && (
            <div className="mb-3 flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg px-2 py-1.5">
              <Link className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-xs text-blue-300 truncate flex-1">
                {fetchedUrl.title || fetchedUrl.url}
              </span>
              <button
                type="button"
                onClick={() => setFetchedUrl(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* URL input inline */}
          {showUrlInput && (
            <div className="mb-3">
              <div className="flex gap-2 items-center">
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
                  className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  {isFetchingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Fetch"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setShowUrlInput(false); setUrlError(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {urlError && (
                <p className="text-xs text-destructive mt-1">{urlError}</p>
              )}
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isDragging
                ? "Drop images here..."
                : "Describe your animation... (paste or drop images)"
            }
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground-dim focus:outline-none resize-none overflow-y-auto text-base min-h-15 max-h-50"
            style={{ fieldSizing: "content" }}
            disabled={isNavigating}
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

          <div className="flex justify-end items-center mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isNavigating || !canAddMore}
                className="text-muted-foreground hover:text-foreground"
                title="Attach images"
              >
                <Paperclip className="w-5 h-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowUrlInput((v) => !v)}
                disabled={isNavigating}
                className={fetchedUrl ? "text-blue-400" : "text-muted-foreground hover:text-foreground"}
                title="Attach URL"
              >
                <Link className="w-5 h-5" />
              </Button>

              <Button
                type="submit"
                size="icon-sm"
                disabled={!prompt.trim() || isNavigating}
                loading={isNavigating}
                className="bg-foreground text-background hover:bg-gray-200"
              >
                <ArrowUp className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center mt-6 gap-2">
          <span className="text-muted-foreground-dim text-xs mr-1">
            Prompt Examples
          </span>
          {examplePrompts.map((example) => {
            const Icon = iconMap[example.icon];
            return (
              <button
                key={example.id}
                type="button"
                onClick={() => setPrompt(example.prompt)}
                style={{
                  borderColor: `${example.color}40`,
                  color: example.color,
                }}
                className="rounded-full bg-background-elevated border hover:brightness-125 transition-all flex items-center gap-1 px-1.5 py-0.5 text-[11px]"
              >
                <Icon className="w-3 h-3" />
                {example.headline}
              </button>
            );
          })}
        </div>

        {showCodeExamplesLink && (
          <div className="flex justify-center mt-4">
            <NextLink
              href="/code-examples"
              className="text-muted-foreground-dim hover:text-muted-foreground text-xs transition-colors flex items-center gap-1"
            >
              View Code examples
              <SquareArrowOutUpRight className="w-3 h-3" />
            </NextLink>
          </div>
        )}
      </form>
    </div>
  );
}
