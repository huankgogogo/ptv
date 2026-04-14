# LLM-Controlled Video Duration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the LLM control video duration via a `// @remotion-config` comment; default 10s (300 frames).

**Architecture:** LLM outputs `// @remotion-config {"durationInFrames":300,"fps":30}` as the first line of every generated file. After generation completes, the frontend parses this comment and updates player state. The compiler strips the comment before Babel so it doesn't affect runtime.

**Tech Stack:** Next.js, React, TypeScript, Remotion, Babel standalone

---

## File Map

| File | Change |
|------|--------|
| `src/app/api/generate/route.ts` | Add `@remotion-config` instruction to `SYSTEM_PROMPT` and `FOLLOW_UP_SYSTEM_PROMPT` |
| `src/app/generate/page.tsx` | Default state → 300 frames; parse config in `handleGenerationComplete` |
| `src/remotion/compiler.ts` | Strip config comment in `extractComponentBody` before Babel compilation |

---

### Task 1: Update SYSTEM_PROMPT to output @remotion-config

**Files:**
- Modify: `src/app/api/generate/route.ts` (around line 113 — end of `SYSTEM_PROMPT`)

- [ ] **Step 1: Add config annotation rule to SYSTEM_PROMPT**

In `src/app/api/generate/route.ts`, find the `## OUTPUT FORMAT (CRITICAL)` section inside `SYSTEM_PROMPT` (around line 112). Add the following rule as the **first bullet** in that section:

```typescript
// Before:
## OUTPUT FORMAT (CRITICAL)

- Output ONLY code. Zero natural language anywhere in the response.
- The very first characters must be "import". The very last characters must be "};".

// After:
## OUTPUT FORMAT (CRITICAL)

- The very first line of your output MUST be the config comment (before any imports):
  // @remotion-config {"durationInFrames":300,"fps":30}
  Adjust durationInFrames and fps to suit the animation's natural length. Default: 300 frames at 30fps = 10 seconds. Example: a 5-second animation → {"durationInFrames":150,"fps":30}.
- Output ONLY code. Zero natural language anywhere in the response.
- The very first import must come on line 2. The very last characters must be "};".
```

- [ ] **Step 2: Add duration update rule to FOLLOW_UP_SYSTEM_PROMPT**

Find `FOLLOW_UP_SYSTEM_PROMPT` (around line 122). Add a new section at the end, before the closing backtick:

```typescript
// Add before the closing backtick of FOLLOW_UP_SYSTEM_PROMPT:

## DURATION CONFIG

The current code always has a @remotion-config comment on line 1.
If the user asks to change video duration or fps:
- For type "edit": include an edit that updates the comment. Example:
  old_string: '// @remotion-config {"durationInFrames":300,"fps":30}'
  new_string: '// @remotion-config {"durationInFrames":450,"fps":30}'
- For type "full": include the updated comment on line 1 of the replacement code.
If the user does NOT ask to change duration, leave the comment unchanged.
```

- [ ] **Step 3: Commit**

```bash
cd /Users/huandoy/projects/demo/ptv
git add src/app/api/generate/route.ts
git commit -m "feat: instruct LLM to output @remotion-config comment for duration control"
```

---

### Task 2: Strip @remotion-config comment in compiler

**Files:**
- Modify: `src/remotion/compiler.ts:34-38`

- [ ] **Step 1: Add strip line in extractComponentBody**

In `src/remotion/compiler.ts`, inside `extractComponentBody`, after the markdown fence stripping (line 36) and before the import stripping, add:

```typescript
// After:
let cleaned = code.replace(/^```[a-z]*\n?/gm, "").replace(/^```\s*$/gm, "").trim();

// Add this line:
// Strip @remotion-config annotation (used for player config, not needed at runtime)
cleaned = cleaned.replace(/^\/\/ @remotion-config \{[^\n]*\}\n?/, "");
```

- [ ] **Step 2: Verify compiler still works**

The function should still correctly extract component body after stripping. Confirm the regex only matches the specific comment pattern at the start of the string.

- [ ] **Step 3: Commit**

```bash
git add src/remotion/compiler.ts
git commit -m "feat: strip @remotion-config comment before Babel compilation"
```

---

### Task 3: Update default duration and parse config in generate page

**Files:**
- Modify: `src/app/generate/page.tsx:33-36` (default state)
- Modify: `src/app/generate/page.tsx:182-190` (`handleGenerationComplete`)

- [ ] **Step 1: Change default durationInFrames to 300**

In `src/app/generate/page.tsx`, change lines 33-36:

```typescript
// Before:
const [durationInFrames, setDurationInFrames] = useState(
  examples[0]?.durationInFrames || 150,
);
const [fps, setFps] = useState(examples[0]?.fps || 30);

// After:
const [durationInFrames, setDurationInFrames] = useState(300);
const [fps, setFps] = useState(30);
```

- [ ] **Step 2: Add parseRemotionConfig helper**

Add this function just before the `GeneratePageContent` component function body (outside the component, after the `MAX_CORRECTION_ATTEMPTS` const):

```typescript
function parseRemotionConfig(code: string): { durationInFrames: number; fps: number } | null {
  const match = code.match(/\/\/ @remotion-config ({.*})/);
  if (!match) return null;
  try {
    const config = JSON.parse(match[1]) as { durationInFrames?: unknown; fps?: unknown };
    if (typeof config.durationInFrames === "number" && typeof config.fps === "number") {
      return { durationInFrames: config.durationInFrames, fps: config.fps };
    }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Call parseRemotionConfig in handleGenerationComplete**

Update `handleGenerationComplete` (lines 182-190):

```typescript
// Before:
const handleGenerationComplete = useCallback(
  (generatedCode: string, summary?: string, metadata?: AssistantMetadata) => {
    const content =
      summary || "Generated your animation, any follow up edits?";
    addAssistantMessage(content, generatedCode, metadata);
    markAsAiGenerated();
  },
  [addAssistantMessage, markAsAiGenerated],
);

// After:
const handleGenerationComplete = useCallback(
  (generatedCode: string, summary?: string, metadata?: AssistantMetadata) => {
    const content =
      summary || "Generated your animation, any follow up edits?";
    addAssistantMessage(content, generatedCode, metadata);
    markAsAiGenerated();
    const config = parseRemotionConfig(generatedCode);
    if (config) {
      setDurationInFrames(config.durationInFrames);
      setFps(config.fps);
    }
  },
  [addAssistantMessage, markAsAiGenerated, setDurationInFrames, setFps],
);
```

- [ ] **Step 4: Commit**

```bash
git add src/app/generate/page.tsx
git commit -m "feat: parse @remotion-config from generated code to update player duration"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Start dev server**

```bash
cd /Users/huandoy/projects/demo/ptv
pnpm dev
```

- [ ] **Step 2: Test initial generation**

Open the app, generate a new animation with any prompt. Verify:
1. The generated code's first line is `// @remotion-config {"durationInFrames":300,"fps":30}` (visible in code editor)
2. The player duration shows 10s (or whatever the LLM chose)
3. The animation plays correctly (comment was stripped by compiler)

- [ ] **Step 3: Test follow-up duration change**

With an animation loaded, send a follow-up message: "改成15秒" (make it 15 seconds). Verify:
1. The player duration updates to 15s (450 frames at 30fps)
2. The `@remotion-config` comment on line 1 shows `"durationInFrames":450`

- [ ] **Step 4: Test fallback**

Verify the settings modal still works for manual duration override.
