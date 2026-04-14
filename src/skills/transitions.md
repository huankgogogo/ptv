---
name: transitions
description: Scene transitions and overlays for Remotion using TransitionSeries
metadata:
  tags: transitions, overlays, fade, slide, wipe, scenes
---

## TransitionSeries

`<TransitionSeries>` arranges scenes and supports two ways to enhance the cut point:

- **Transitions** (`<TransitionSeries.Transition>`) — crossfade, slide, wipe, etc. Shortens timeline because both scenes play simultaneously during transition.
- **Overlays** (`<TransitionSeries.Overlay>`) — render an effect on top of the cut point without shortening the timeline.

## Transition example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>;
```

## Available transition types

```tsx
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
```

## Slide transition with direction

```tsx
<TransitionSeries.Transition
  presentation={slide({ direction: "from-left" })}
  timing={linearTiming({ durationInFrames: 20 })}
/>;
```

Directions: `"from-left"`, `"from-right"`, `"from-top"`, `"from-bottom"`

## Timing options

```tsx
import { linearTiming, springTiming } from "@remotion/transitions";

// Linear timing - constant speed
linearTiming({ durationInFrames: 20 });

// Spring timing - organic motion
springTiming({ config: { damping: 200 }, durationInFrames: 25 });
```

## Duration calculation

Transitions overlap adjacent scenes, so total composition length is **shorter** than sum of all sequence durations.

For example, with two 60-frame sequences and a 15-frame transition:

- Without transitions: `60 + 60 = 120` frames
- With transition: `60 + 60 - 15 = 105` frames

## Custom crossfade without TransitionSeries

For simple opacity crossfades within a single component:

```tsx
const TRANSITION_START = 60;
const TRANSITION_DURATION = 15;

const scene1Opacity = interpolate(
  frame,
  [TRANSITION_START, TRANSITION_START + TRANSITION_DURATION],
  [1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

const scene2Opacity = interpolate(
  frame,
  [TRANSITION_START, TRANSITION_START + TRANSITION_DURATION],
  [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

<AbsoluteFill style={{ opacity: scene1Opacity }}><SceneA /></AbsoluteFill>
<AbsoluteFill style={{ opacity: scene2Opacity }}><SceneB /></AbsoluteFill>
```
