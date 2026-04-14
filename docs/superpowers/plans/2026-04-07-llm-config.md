# LLM Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to input their own LLM Base URL, API Key, and Model name via a Header button + Dialog, persisted in localStorage, replacing the hardcoded MODELS dropdown and server-side env var.

**Architecture:** A `useLLMConfig` hook reads/writes localStorage; `LLMSettingsModal` provides the UI in the Header; `useGenerationApi` reads config from the hook and passes it in the fetch body; the API route uses the client-provided values to create the OpenAI client.

**Tech Stack:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui Dialog, `@ai-sdk/openai`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/generation.ts` | Modify | Add `LLMConfig`, remove `MODELS`/`ModelId` |
| `src/hooks/useLLMConfig.ts` | Create | localStorage read/write for LLM config |
| `src/hooks/useGenerationApi.ts` | Modify | Read config from `useLLMConfig`, pass in body |
| `src/app/api/generate/route.ts` | Modify | Use client-provided config, remove env fallback |
| `src/components/LLMSettingsModal.tsx` | Create | Button + Dialog with 3 input fields |
| `src/components/PageLayout.tsx` | Modify | Render `LLMSettingsModal` in header |
| `src/components/ChatSidebar/ChatInput.tsx` | Modify | Remove model Select dropdown + props |
| `src/components/ChatSidebar/ChatSidebar.tsx` | Modify | Remove model state; update `runGeneration` call |
| `src/components/LandingPageInput.tsx` | Modify | Remove model Select dropdown |
| `src/app/page.tsx` | Modify | Remove model from `handleNavigate` and URL params |

---

### Task 1: Add `LLMConfig` type to generation.ts

**Files:**
- Modify: `src/types/generation.ts`

- [ ] **Step 1: Add `LLMConfig` interface** (keep `MODELS`/`ModelId` for now — removed in Task 9)

Replace the full contents of `src/types/generation.ts` with:

```ts
export const MODELS = [
  { id: "gpt-5.2:none", name: "GPT-5.2 (No Reasoning)" },
  { id: "gpt-5.2:low", name: "GPT-5.2 (Low Reasoning)" },
  { id: "gpt-5.2:medium", name: "GPT-5.2 (Medium Reasoning)" },
  { id: "gpt-5.2:high", name: "GPT-5.2 (High Reasoning)" },
  { id: "gpt-5.2-pro:medium", name: "GPT-5.2 Pro (Medium)" },
  { id: "gpt-5.2-pro:high", name: "GPT-5.2 Pro (High)" },
  { id: "gpt-5.2-pro:xhigh", name: "GPT-5.2 Pro (XHigh)" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export type StreamPhase = "idle" | "reasoning" | "generating";

export type GenerationErrorType = "validation" | "api";

export interface LLMConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/generation.ts
git commit -m "feat: add LLMConfig type to generation.ts"
```

---

### Task 2: Create `useLLMConfig` hook

**Files:**
- Create: `src/hooks/useLLMConfig.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useLLMConfig.ts`:

```ts
"use client";

import type { LLMConfig } from "@/types/generation";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ptv_llm_config";

const DEFAULT_CONFIG: LLMConfig = {
  baseURL: "",
  apiKey: "",
  model: "",
};

function readFromStorage(): LLMConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CONFIG;
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    return {
      baseURL: String(parsed.baseURL ?? ""),
      apiKey: String(parsed.apiKey ?? ""),
      model: String(parsed.model ?? ""),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useLLMConfig(): {
  config: LLMConfig;
  setConfig: (config: LLMConfig) => void;
  isConfigured: boolean;
} {
  const [config, setConfigState] = useState<LLMConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setConfigState(readFromStorage());
  }, []);

  const setConfig = useCallback((newConfig: LLMConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setConfigState(newConfig);
  }, []);

  const isConfigured =
    config.baseURL.trim() !== "" &&
    config.apiKey.trim() !== "" &&
    config.model.trim() !== "";

  return { config, setConfig, isConfigured };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLLMConfig.ts
git commit -m "feat: add useLLMConfig hook with localStorage persistence"
```

---

### Task 3: Create `LLMSettingsModal` component

**Files:**
- Create: `src/components/LLMSettingsModal.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/LLMSettingsModal.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLLMConfig } from "@/hooks/useLLMConfig";
import { AlertCircle, Eye, EyeOff, Settings } from "lucide-react";
import { useState } from "react";

export function LLMSettingsModal() {
  const { config, setConfig, isConfigured } = useLLMConfig();
  const [open, setOpen] = useState(false);
  const [localBaseURL, setLocalBaseURL] = useState("");
  const [localApiKey, setLocalApiKey] = useState("");
  const [localModel, setLocalModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalBaseURL(config.baseURL);
      setLocalApiKey(config.apiKey);
      setLocalModel(config.model);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    setConfig({
      baseURL: localBaseURL.trim(),
      apiKey: localApiKey.trim(),
      model: localModel.trim(),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          {!isConfigured && (
            <AlertCircle className="w-4 h-4 text-orange-400" />
          )}
          <Settings className="w-4 h-4" />
          API Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-background-elevated border-border text-foreground">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">Base URL</label>
            <input
              type="text"
              value={localBaseURL}
              onChange={(e) => setLocalBaseURL(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 rounded border border-border bg-input text-foreground text-sm font-sans focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 rounded border border-border bg-input text-foreground text-sm font-sans focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">Model</label>
            <input
              type="text"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              placeholder="gpt-4o"
              className="w-full px-3 py-2 rounded border border-border bg-input text-foreground text-sm font-sans focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LLMSettingsModal.tsx
git commit -m "feat: add LLMSettingsModal component"
```

---

### Task 4: Add `LLMSettingsModal` to `PageLayout`

**Files:**
- Modify: `src/components/PageLayout.tsx`

- [ ] **Step 1: Update PageLayout to render LLMSettingsModal**

Replace the full contents of `src/components/PageLayout.tsx` with:

```tsx
"use client";

import { Header } from "./Header";
import { LLMSettingsModal } from "./LLMSettingsModal";

interface PageLayoutProps {
  children: React.ReactNode;
  rightContent?: React.ReactNode;
  showLogoAsLink?: boolean;
}

export function PageLayout({
  children,
  rightContent,
  showLogoAsLink = false,
}: PageLayoutProps) {
  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      <header className="flex justify-between items-start py-8 px-12 shrink-0">
        <Header asLink={showLogoAsLink} />
        <div className="flex items-center gap-2">
          {rightContent}
          <LLMSettingsModal />
        </div>
      </header>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PageLayout.tsx
git commit -m "feat: add LLMSettingsModal to PageLayout header"
```

---

### Task 5: Update API route to use client-provided config

**Files:**
- Modify: `src/app/api/generate/route.ts`

- [ ] **Step 1: Update the `GenerateRequest` interface and handler**

In `src/app/api/generate/route.ts`, find and replace the `GenerateRequest` interface and the start of `POST`:

Old `GenerateRequest`:
```ts
interface GenerateRequest {
  prompt: string;
  model?: string;
  currentCode?: string;
  conversationHistory?: ConversationContextMessage[];
  isFollowUp?: boolean;
  hasManualEdits?: boolean;
  /** Error correction context for self-healing loops */
  errorCorrection?: ErrorCorrectionContext;
  /** Skills already used in this conversation (to avoid redundant skill content) */
  previouslyUsedSkills?: string[];
  /** Base64 image data URLs for visual context */
  frameImages?: string[];
}
```

New `GenerateRequest`:
```ts
interface GenerateRequest {
  prompt: string;
  llmBaseURL: string;
  llmApiKey: string;
  llmModel: string;
  currentCode?: string;
  conversationHistory?: ConversationContextMessage[];
  isFollowUp?: boolean;
  hasManualEdits?: boolean;
  /** Error correction context for self-healing loops */
  errorCorrection?: ErrorCorrectionContext;
  /** Skills already used in this conversation (to avoid redundant skill content) */
  previouslyUsedSkills?: string[];
  /** Base64 image data URLs for visual context */
  frameImages?: string[];
}
```

- [ ] **Step 2: Replace the destructuring and client setup at the top of `POST`**

Old block (lines 297–328):
```ts
export async function POST(req: Request) {
  const {
    prompt,
    model = "gpt-5.2",
    currentCode,
    conversationHistory = [],
    isFollowUp = false,
    hasManualEdits = false,
    errorCorrection,
    previouslyUsedSkills = [],
    frameImages,
  }: GenerateRequest = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'The environment variable "OPENAI_API_KEY" is not set. Add it to your .env file and try again.',
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Parse model ID - format can be "model-name" or "model-name:reasoning_effort"
  const [modelName, reasoningEffort] = model.split(":");

  const openai = createOpenAI({ apiKey });
```

New block:
```ts
export async function POST(req: Request) {
  const {
    prompt,
    llmBaseURL,
    llmApiKey,
    llmModel,
    currentCode,
    conversationHistory = [],
    isFollowUp = false,
    hasManualEdits = false,
    errorCorrection,
    previouslyUsedSkills = [],
    frameImages,
  }: GenerateRequest = await req.json();

  if (!llmBaseURL || !llmApiKey || !llmModel) {
    return new Response(
      JSON.stringify({
        error:
          "请在页面顶部的 API Settings 中配置 LLM Base URL、API Key 和 Model。",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const openai = createOpenAI({ baseURL: llmBaseURL, apiKey: llmApiKey });
```

- [ ] **Step 3: Replace all uses of `modelName` with `llmModel`**

There are three places that use `modelName` or `reasoningEffort`:

**Validation call** — find:
```ts
      const validationResult = await generateObject({
        model: openai("gpt-5.2"),
```
Replace with:
```ts
      const validationResult = await generateObject({
        model: openai(llmModel),
```

**Skill detection call** — find:
```ts
    const skillResult = await generateObject({
      model: openai("gpt-5.2"),
```
Replace with:
```ts
    const skillResult = await generateObject({
      model: openai(llmModel),
```

**Follow-up edit call** — find:
```ts
      const editResult = await generateObject({
        model: openai(modelName),
```
Replace with:
```ts
      const editResult = await generateObject({
        model: openai(llmModel),
```

**Initial streaming call** — find:
```ts
    const result = streamText({
      model: openai(modelName),
      system: enhancedSystemPrompt,
      messages: initialMessages,
      ...(reasoningEffort && {
        providerOptions: {
          openai: {
            reasoningEffort: reasoningEffort,
          },
        },
      }),
    });
```
Replace with:
```ts
    const result = streamText({
      model: openai(llmModel),
      system: enhancedSystemPrompt,
      messages: initialMessages,
    });
```

**Metadata in response** — find:
```ts
        metadata: {
          skills: detectedSkills,
          editType,
          edits: appliedEdits,
          model: modelName,
        },
```
Replace with:
```ts
        metadata: {
          skills: detectedSkills,
          editType,
          edits: appliedEdits,
          model: llmModel,
        },
```

**Console log** — find:
```ts
      console.log(
        "Follow-up edit with prompt:",
        prompt,
        "model:",
        modelName,
```
Replace with:
```ts
      console.log(
        "Follow-up edit with prompt:",
        prompt,
        "model:",
        llmModel,
```

**Second console log** — find:
```ts
    console.log(
      "Generating React component with prompt:",
      prompt,
      "model:",
      modelName,
      "skills:",
      detectedSkills.length > 0 ? detectedSkills.join(", ") : "general",
      reasoningEffort ? `reasoning_effort: ${reasoningEffort}` : "",
      hasImages ? `(with ${frameImages.length} image(s))` : "",
    );
```
Replace with:
```ts
    console.log(
      "Generating React component with prompt:",
      prompt,
      "model:",
      llmModel,
      "skills:",
      detectedSkills.length > 0 ? detectedSkills.join(", ") : "general",
      hasImages ? `(with ${frameImages.length} image(s))` : "",
    );
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: use client-provided LLM config in generate route"
```

---

### Task 6: Update `useGenerationApi` to read config and pass in body

**Files:**
- Modify: `src/hooks/useGenerationApi.ts`

- [ ] **Step 1: Replace the full file**

Replace `src/hooks/useGenerationApi.ts` with:

```ts
import {
  extractComponentCode,
  stripMarkdownFences,
  validateGptResponse,
} from "@/helpers/sanitize-response";
import type {
  AssistantMetadata,
  ConversationContextMessage,
  ErrorCorrectionContext,
} from "@/types/conversation";
import type {
  GenerationErrorType,
  StreamPhase,
} from "@/types/generation";
import { useLLMConfig } from "@/hooks/useLLMConfig";
import { useCallback, useState } from "react";

interface FailedEditInfo {
  description: string;
  old_string: string;
  new_string: string;
}

interface GenerationCallbacks {
  onCodeGenerated?: (code: string) => void;
  onStreamingChange?: (isStreaming: boolean) => void;
  onStreamPhaseChange?: (phase: StreamPhase) => void;
  onError?: (
    error: string,
    type: GenerationErrorType,
    failedEdit?: FailedEditInfo,
  ) => void;
  onMessageSent?: (prompt: string, attachedImages?: string[]) => void;
  onGenerationComplete?: (
    code: string,
    summary?: string,
    metadata?: AssistantMetadata,
  ) => void;
  onErrorMessage?: (
    message: string,
    errorType: "edit_failed" | "api" | "validation",
    failedEdit?: FailedEditInfo,
  ) => void;
  onPendingMessage?: (skills?: string[]) => void;
  onClearPendingMessage?: () => void;
}

interface GenerationContext {
  currentCode?: string;
  conversationHistory: ConversationContextMessage[];
  previouslyUsedSkills: string[];
  isFollowUp: boolean;
  hasManualEdits: boolean;
  errorCorrection?: ErrorCorrectionContext;
  frameImages?: string[];
}

interface UseGenerationApiReturn {
  isLoading: boolean;
  runGeneration: (
    prompt: string,
    context: GenerationContext,
    callbacks: GenerationCallbacks,
    options?: { silent?: boolean },
  ) => Promise<void>;
}

export function useGenerationApi(): UseGenerationApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { config, isConfigured } = useLLMConfig();

  const runGeneration = useCallback(
    async (
      prompt: string,
      context: GenerationContext,
      callbacks: GenerationCallbacks,
      options?: { silent?: boolean },
    ) => {
      if (!prompt.trim() || isLoading) return;

      if (!isConfigured) {
        callbacks.onError?.(
          "请先在页面顶部的 API Settings 中配置 LLM Base URL、API Key 和 Model。",
          "api",
        );
        return;
      }

      const {
        currentCode,
        conversationHistory,
        previouslyUsedSkills,
        isFollowUp,
        hasManualEdits,
        errorCorrection,
        frameImages,
      } = context;

      const {
        onCodeGenerated,
        onStreamingChange,
        onStreamPhaseChange,
        onError,
        onMessageSent,
        onGenerationComplete,
        onErrorMessage,
        onPendingMessage,
        onClearPendingMessage,
      } = callbacks;

      setIsLoading(true);
      onStreamingChange?.(true);
      onStreamPhaseChange?.("reasoning");

      // Only add user message if not a silent retry
      if (!options?.silent) {
        onMessageSent?.(prompt, frameImages);
      }

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            llmBaseURL: config.baseURL,
            llmApiKey: config.apiKey,
            llmModel: config.model,
            currentCode: isFollowUp ? currentCode : undefined,
            conversationHistory: isFollowUp ? conversationHistory : [],
            previouslyUsedSkills: isFollowUp ? previouslyUsedSkills : [],
            isFollowUp,
            hasManualEdits,
            errorCorrection,
            frameImages,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error || `API error: ${response.status}`;
          if (errorData.type === "edit_failed") {
            onError?.(errorMessage, "validation", errorData.failedEdit);
            onErrorMessage?.(errorMessage, "edit_failed", errorData.failedEdit);
            return;
          }
          if (errorData.type === "validation") {
            onError?.(errorMessage, "validation");
            onErrorMessage?.(errorMessage, "validation");
            return;
          }
          throw new Error(errorMessage);
        }

        const contentType = response.headers.get("content-type") || "";

        // Handle JSON response (non-streaming, for follow-up edits)
        if (contentType.includes("application/json")) {
          const data = await response.json();
          const { code, summary, metadata } = data;
          onCodeGenerated?.(code);
          onGenerationComplete?.(code, summary, metadata);
          const validation = validateGptResponse(code);
          if (!validation.isValid && validation.error) {
            onError?.(validation.error, "validation");
          }
          return;
        }

        // Handle SSE stream response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulatedText = "";
        let buffer = "";
        let streamMetadata: AssistantMetadata = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              if (event.type === "metadata") {
                streamMetadata = {
                  ...streamMetadata,
                  skills: event.skills,
                };
                onPendingMessage?.(event.skills);
              } else if (event.type === "reasoning-start") {
                onStreamPhaseChange?.("reasoning");
              } else if (event.type === "text-start") {
                onStreamPhaseChange?.("generating");
              } else if (event.type === "text-delta") {
                accumulatedText += event.delta;
                const codeToShow = stripMarkdownFences(accumulatedText);
                onCodeGenerated?.(codeToShow);
              } else if (event.type === "error") {
                throw new Error(event.error);
              }
            } catch (parseError) {
              if (
                parseError instanceof Error &&
                parseError.message !== "Unexpected token"
              ) {
                throw parseError;
              }
            }
          }
        }

        let finalCode = stripMarkdownFences(accumulatedText);
        finalCode = extractComponentCode(finalCode);
        onCodeGenerated?.(finalCode);
        onClearPendingMessage?.();
        onGenerationComplete?.(
          finalCode,
          undefined,
          streamMetadata.skills?.length ? streamMetadata : undefined,
        );

        const validation = validateGptResponse(finalCode);
        if (!validation.isValid && validation.error) {
          onError?.(validation.error, "validation");
        }
      } catch (error) {
        console.error("Error generating code:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        onError?.(errorMessage, "api");
      } finally {
        setIsLoading(false);
        onStreamingChange?.(false);
        onStreamPhaseChange?.("idle");
        onClearPendingMessage?.();
      }
    },
    [isLoading, config, isConfigured],
  );

  return {
    isLoading,
    runGeneration,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -20
```

Expected: errors in `ChatSidebar.tsx` because `runGeneration` signature changed (model arg removed). That's expected — fixed in Task 7.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGenerationApi.ts
git commit -m "feat: useGenerationApi reads LLMConfig and passes it in request body"
```

---

### Task 7: Remove model from `ChatInput`

**Files:**
- Modify: `src/components/ChatSidebar/ChatInput.tsx`

- [ ] **Step 1: Replace `ChatInput.tsx` with model props and Select removed**

Replace the full contents of `src/components/ChatSidebar/ChatInput.tsx` with:

```tsx
"use client";

import { ErrorDisplay } from "@/components/ErrorDisplay";
import { Button } from "@/components/ui/button";
import { captureFrame } from "@/helpers/capture-frame";
import { useImageAttachments } from "@/hooks/useImageAttachments";
import { ArrowUp, Camera, Paperclip, X } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

interface ChatInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  isLoading: boolean;
  onSubmit: (attachedImages?: string[]) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit(attachedImages.length > 0 ? attachedImages : undefined);
    clearImages();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (Shift+Enter for new line)
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
                  <div key={index} className="relative flex-shrink-0">
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
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground-dim focus:outline-none resize-none text-sm min-h-[36px] max-h-[120px]"
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -20
```

Expected: errors in `ChatSidebar.tsx` still (passing model/onModelChange). Fixed next.

- [ ] **Step 3: Commit**

```bash
git add src/components/ChatSidebar/ChatInput.tsx
git commit -m "refactor: remove model select from ChatInput"
```

---

### Task 8: Remove model state from `ChatSidebar` and fix `runGeneration` call

**Files:**
- Modify: `src/components/ChatSidebar/ChatSidebar.tsx`

- [ ] **Step 1: Replace `ChatSidebar.tsx`**

Replace the full contents of `src/components/ChatSidebar/ChatSidebar.tsx` with:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useGenerationApi } from "@/hooks/useGenerationApi";
import { cn } from "@/lib/utils";
import type {
  AssistantMetadata,
  ConversationContextMessage,
  ConversationMessage,
  EditOperation,
  ErrorCorrectionContext,
} from "@/types/conversation";
import type {
  GenerationErrorType,
  StreamPhase,
} from "@/types/generation";
import { PanelLeftClose, PanelLeftOpen, RotateCcw } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentType,
} from "react";
import { ChatHistory } from "./ChatHistory";
import { ChatInput } from "./ChatInput";

export interface ChatSidebarRef {
  triggerGeneration: (options?: {
    silent?: boolean;
    attachedImages?: string[];
  }) => void;
}

interface ChatSidebarProps {
  messages: ConversationMessage[];
  pendingMessage?: {
    skills?: string[];
    startedAt: number;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasManualEdits: boolean;
  // Generation callbacks
  onCodeGenerated?: (code: string) => void;
  onStreamingChange?: (isStreaming: boolean) => void;
  onStreamPhaseChange?: (phase: StreamPhase) => void;
  onError?: (
    error: string,
    type: GenerationErrorType,
    failedEdit?: EditOperation,
  ) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  currentCode?: string;
  conversationHistory?: ConversationContextMessage[];
  previouslyUsedSkills?: string[];
  isFollowUp?: boolean;
  onMessageSent?: (prompt: string, attachedImages?: string[]) => void;
  onGenerationComplete?: (
    code: string,
    summary?: string,
    metadata?: AssistantMetadata,
  ) => void;
  onErrorMessage?: (
    message: string,
    errorType: "edit_failed" | "api" | "validation",
  ) => void;
  errorCorrection?: ErrorCorrectionContext;
  onPendingMessage?: (skills?: string[]) => void;
  onClearPendingMessage?: () => void;
  // Frame capture props
  Component?: ComponentType | null;
  fps?: number;
  durationInFrames?: number;
  currentFrame?: number;
}

export const ChatSidebar = forwardRef<ChatSidebarRef, ChatSidebarProps>(
  function ChatSidebar(
    {
      messages,
      pendingMessage,
      isCollapsed,
      onToggleCollapse,
      hasManualEdits,
      onCodeGenerated,
      onStreamingChange,
      onStreamPhaseChange,
      onError,
      prompt,
      onPromptChange,
      currentCode,
      conversationHistory = [],
      previouslyUsedSkills = [],
      isFollowUp = false,
      onMessageSent,
      onGenerationComplete,
      onErrorMessage,
      errorCorrection,
      onPendingMessage,
      onClearPendingMessage,
      Component,
      fps = 30,
      durationInFrames = 150,
      currentFrame = 0,
    },
    ref,
  ) {
    const promptRef = useRef<string>("");

    const { isLoading, runGeneration } = useGenerationApi();

    // Keep prompt ref in sync for use in triggerGeneration
    useEffect(() => {
      promptRef.current = prompt;
    }, [prompt]);

    const handleGeneration = async (options?: {
      silent?: boolean;
      attachedImages?: string[];
    }) => {
      const currentPrompt = promptRef.current;
      if (!currentPrompt.trim()) return;

      onPromptChange(""); // Clear input immediately

      await runGeneration(
        currentPrompt,
        {
          currentCode,
          conversationHistory,
          previouslyUsedSkills,
          isFollowUp,
          hasManualEdits,
          errorCorrection,
          frameImages: options?.attachedImages,
        },
        {
          onCodeGenerated,
          onStreamingChange,
          onStreamPhaseChange,
          onError,
          onMessageSent,
          onGenerationComplete,
          onErrorMessage,
          onPendingMessage,
          onClearPendingMessage,
        },
        options,
      );
    };

    // Expose triggerGeneration via ref
    useImperativeHandle(ref, () => ({
      triggerGeneration: handleGeneration,
    }));

    return (
      <div
        className={cn(
          "flex flex-col bg-background transition-all duration-300",
          isCollapsed
            ? "w-12 shrink-0"
            : "w-full h-[40vh] min-[1000px]:h-auto min-[1000px]:w-[40%] min-[1000px]:min-w-[320px] min-[1000px]:max-w-[520px] shrink",
        )}
      >
        {isCollapsed ? (
          <div className="flex justify-center px-4 mb-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapse}
              className="text-muted-foreground hover:text-foreground"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          /* Chat area with subtle backdrop */
          <div className="flex-1 flex flex-col min-h-0 ml-12 mr-8 mb-8 rounded-xl bg-muted/20 border border-border/30 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between px-4 pt-4 pb-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Assistant Chat
              </h2>
              <div className="flex items-center gap-1 -mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Start over? This will reset your animation.",
                      )
                    ) {
                      window.location.href = "/";
                    }
                  }}
                  title="Start over"
                  className="text-muted-foreground hover:text-foreground text-xs gap-1 h-7 px-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onToggleCollapse}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ChatHistory messages={messages} pendingMessage={pendingMessage} />

            {/* Input */}
            <ChatInput
              prompt={prompt}
              onPromptChange={onPromptChange}
              isLoading={isLoading}
              onSubmit={(attachedImages) =>
                handleGeneration({ attachedImages })
              }
              Component={Component}
              fps={fps}
              durationInFrames={durationInFrames}
              currentFrame={currentFrame}
            />
          </div>
        )}
      </div>
    );
  },
);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -20
```

Expected: remaining errors only in `LandingPageInput.tsx` and `page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ChatSidebar/ChatSidebar.tsx
git commit -m "refactor: remove model state from ChatSidebar"
```

---

### Task 9: Remove model from `LandingPageInput` and home `page.tsx`

**Files:**
- Modify: `src/components/LandingPageInput.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the full contents of `src/components/LandingPageInput.tsx`**

```tsx
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
  MessageCircle,
  Paperclip,
  SquareArrowOutUpRight,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const iconMap: Record<string, LucideIcon> = {
  Type,
  MessageCircle,
  Hash,
  BarChart3,
  Disc,
};

interface LandingPageInputProps {
  onNavigate: (prompt: string, attachedImages?: string[]) => void;
  isNavigating?: boolean;
  showCodeExamplesLink?: boolean;
}

export function LandingPageInput({
  onNavigate,
  isNavigating = false,
  showCodeExamplesLink = false,
}: LandingPageInputProps) {
  const [prompt, setPrompt] = useState("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isNavigating) return;
    onNavigate(
      prompt,
      attachedImages.length > 0 ? attachedImages : undefined,
    );
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
                <div key={index} className="relative flex-shrink-0">
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
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground-dim focus:outline-none resize-none overflow-y-auto text-base min-h-[60px] max-h-[200px]"
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
            <Link
              href="/code-examples"
              className="text-muted-foreground-dim hover:text-muted-foreground text-xs transition-colors flex items-center gap-1"
            >
              View Code examples
              <SquareArrowOutUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/app/page.tsx`**

Replace the full contents of `src/app/page.tsx` with:

```tsx
"use client";

import { LandingPageInput } from "@/components/LandingPageInput";
import { PageLayout } from "@/components/PageLayout";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Home: NextPage = () => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = (prompt: string, attachedImages?: string[]) => {
    setIsNavigating(true);
    // Store images in sessionStorage (too large for URL params)
    if (attachedImages && attachedImages.length > 0) {
      sessionStorage.setItem(
        "initialAttachedImages",
        JSON.stringify(attachedImages),
      );
    } else {
      sessionStorage.removeItem("initialAttachedImages");
    }
    const params = new URLSearchParams({ prompt });
    router.push(`/generate?${params.toString()}`);
  };

  return (
    <PageLayout>
      <LandingPageInput
        onNavigate={handleNavigate}
        isNavigating={isNavigating}
        showCodeExamplesLink
      />
    </PageLayout>
  );
};

export default Home;
```

- [ ] **Step 3: Verify TypeScript compiles with zero errors**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -30
```

Expected: **zero errors**.

- [ ] **Step 4: Commit**

```bash
git add src/components/LandingPageInput.tsx src/app/page.tsx
git commit -m "refactor: remove model param from LandingPageInput and home page"
```

---

### Task 10: Remove `MODELS` and `ModelId` from `generation.ts`

**Files:**
- Modify: `src/types/generation.ts`

- [ ] **Step 1: Verify nothing still imports `MODELS` or `ModelId`**

```bash
cd /Users/huandoy/projects/demo/ptv && grep -r "MODELS\|ModelId" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

Expected: **no output** (zero matches). If any matches appear, fix those files before continuing.

- [ ] **Step 2: Remove `MODELS` and `ModelId` from generation.ts**

Replace the full contents of `src/types/generation.ts` with:

```ts
export type StreamPhase = "idle" | "reasoning" | "generating";

export type GenerationErrorType = "validation" | "api";

export interface LLMConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}
```

- [ ] **Step 3: Verify TypeScript compiles with zero errors**

```bash
cd /Users/huandoy/projects/demo/ptv && npx tsc --noEmit 2>&1 | head -30
```

Expected: **zero errors**.

- [ ] **Step 4: Commit**

```bash
git add src/types/generation.ts
git commit -m "refactor: remove MODELS and ModelId from generation.ts"
```

---

### Task 11: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/huandoy/projects/demo/ptv && pnpm dev
```

- [ ] **Step 2: Verify "API Settings" button appears in the header**

Open http://localhost:3000. The header should show an orange `AlertCircle` icon + `Settings` icon + "API Settings" button on the right.

- [ ] **Step 3: Configure LLM settings**

Click "API Settings". Fill in:
- Base URL: your LLM endpoint (e.g. `https://api.openai.com/v1`)
- API Key: your key
- Model: `gpt-4o` (or any valid model)

Click Save. The `AlertCircle` icon should disappear.

- [ ] **Step 4: Verify generation works end-to-end**

Type a prompt like "a bouncing ball animation" and submit. The animation should generate successfully.

- [ ] **Step 5: Verify unconfigured state shows correct error**

Clear localStorage (`localStorage.removeItem("ptv_llm_config")` in browser console), refresh, and try submitting a prompt without configuring. The error message should say "请先在页面顶部的 API Settings 中配置 LLM Base URL、API Key 和 Model。"

- [ ] **Step 6: Verify config persists after page refresh**

Configure settings, refresh the page, open API Settings again — the fields should be pre-filled with the saved values.
