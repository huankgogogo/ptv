---
name: animations
description: Fundamental animation rules for Remotion - fps-based timing, forbidden CSS transitions
metadata:
  tags: animations, timing, fps, frame, useCurrentFrame
---

All animations MUST be driven by the `useCurrentFrame()` hook.  
Write animations in seconds and multiply them by the `fps` value from `useVideoConfig()`.

```tsx
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return <div style={{ opacity }}>Hello World!</div>;
};
```

CSS transitions or animations are FORBIDDEN - they will not render correctly.  
Tailwind animation class names are FORBIDDEN - they will not render correctly.

## CRITICAL: interpolate() inputRange must be strictly increasing

Every value in the inputRange array MUST be strictly greater than the previous value.  
Identical values (e.g., `[600, 600]`) cause a runtime crash.

```tsx
// ❌ CRASH — identical values
interpolate(frame, [durationInFrames, durationInFrames], [1, 0])

// ❌ CRASH — phase arithmetic that collapses to zero duration
const END = durationInFrames; // 300
const START = END - 0;        // also 300
interpolate(frame, [START, END], [1, 0]) // [300, 300] CRASH

// ✅ CORRECT — always ensure start < end
const FADE_OUT_DURATION = 20; // must be > 0
interpolate(frame, [durationInFrames - FADE_OUT_DURATION, durationInFrames], [1, 0])
```

**Rule**: Before writing any `interpolate()` call, verify that every timing constant used in the inputRange is `> 0` and that `inputRange[n+1] > inputRange[n]`. Minimum gap: 1 frame.
