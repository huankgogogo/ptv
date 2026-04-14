# LLM-Controlled Video Duration

**Date:** 2026-04-08
**Status:** Approved

## Problem

Video duration is hardcoded to `examples[0].durationInFrames` (240 frames = 8s). The LLM has no way to suggest or change the duration, so all generated videos are the same length regardless of content.

## Goal

- Default duration: 10 seconds (300 frames at 30fps)
- LLM can adjust duration in response to user prompts (e.g. "make it 15 seconds", "shorten to 5s")
- Works for both initial generation and follow-up edits

## Approach: Code Comment Annotation

The LLM outputs a special config comment as the **first line** of every generated file. The frontend parses it after generation completes and updates player state.

No extra LLM calls. One consistent mechanism for both streaming (initial) and JSON (follow-up) paths.

## Changes

### 1. `src/app/api/generate/route.ts`

**SYSTEM_PROMPT** — add to OUTPUT FORMAT section:
```
The very first line of your output MUST be:
// @remotion-config {"durationInFrames":300,"fps":30}
Adjust durationInFrames and fps to match the animation's natural length.
Default is 300 frames at 30fps (10 seconds).
```

**FOLLOW_UP_SYSTEM_PROMPT** — add:
```
If the user asks to change the video duration or fps, update the @remotion-config comment
on the first line of the code accordingly. Otherwise leave it unchanged.
```

### 2. `src/app/generate/page.tsx`

**Default state:** change from `examples[0]?.durationInFrames || 150` to `300`, and `examples[0]?.fps || 30` stays `30`.

**Parse on generation complete:** in `handleGenerationComplete` (or equivalent), call `parseRemotionConfig(code)` and update state if a config is found:

```ts
function parseRemotionConfig(code: string): { durationInFrames: number; fps: number } | null {
  const match = code.match(/\/\/ @remotion-config ({.*})/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}
```

Call site (after both streaming and follow-up generation):
```ts
const config = parseRemotionConfig(code);
if (config) {
  setDurationInFrames(config.durationInFrames);
  setFps(config.fps);
}
```

### 3. `src/remotion/compiler.ts` (optional cleanup)

Strip the `@remotion-config` comment before Babel compilation so it doesn't appear in the code editor:

```ts
cleaned = cleaned.replace(/^\/\/ @remotion-config \{.*\}\n?/, '');
```

Add this line at the start of `extractComponentBody`, after stripping markdown fences.

## Data Flow

```
User prompt
    ↓
LLM generates code with // @remotion-config {"durationInFrames":300,"fps":30} on line 1
    ↓
Stream/JSON response received by frontend
    ↓
onGenerationComplete(code) fires
    ↓
parseRemotionConfig(code) → { durationInFrames, fps }
    ↓
setDurationInFrames / setFps → player updates
```

## Edge Cases

- **Parse fails / comment missing:** keep current duration unchanged. No error shown.
- **Invalid JSON in comment:** `try/catch` returns `null`, falls back to current value.
- **follow-up edits that don't change duration:** LLM leaves comment unchanged, parse produces same values, state doesn't visibly change.
- **User manually sets duration in settings modal:** user value stays until next generation completes (then overwritten by LLM value). This is acceptable — the LLM is the source of truth for duration.

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/generate/route.ts` | Add `@remotion-config` instruction to both system prompts |
| `src/app/generate/page.tsx` | Default to 300 frames; parse config on generation complete |
| `src/remotion/compiler.ts` | Strip config comment before Babel compilation |
