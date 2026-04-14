---
name: gif
description: Displaying animated GIFs in Remotion synchronized with the timeline
metadata:
  tags: gif, animation, images, animated, apng, avif, webp
---

# Using Animated GIFs in Remotion

Use `<AnimatedImage>` to display a GIF synchronized with Remotion's timeline:

```tsx
import { AnimatedImage, staticFile } from "remotion";

export const MyComposition = () => {
  return (
    <AnimatedImage src={staticFile("animation.gif")} width={500} height={500} />
  );
};
```

Remote URLs are also supported (must have CORS enabled):

```tsx
<AnimatedImage
  src="https://example.com/animation.gif"
  width={500}
  height={500}
/>
```

## Sizing and fit

```tsx
// Maintain aspect ratio, fit inside container
<AnimatedImage src={staticFile("animation.gif")} width={500} height={300} fit="contain" />

// Fill container, crop if needed
<AnimatedImage src={staticFile("animation.gif")} width={500} height={300} fit="cover" />
```

## Playback speed

```tsx
<AnimatedImage src={staticFile("animation.gif")} width={500} height={500} playbackRate={2} />   {/* 2x speed */}
<AnimatedImage src={staticFile("animation.gif")} width={500} height={500} playbackRate={0.5} /> {/* Half speed */}
```

## Looping behavior

```tsx
// Loop indefinitely (default)
<AnimatedImage src={staticFile("animation.gif")} width={500} height={500} loopBehavior="loop" />

// Play once, show final frame
<AnimatedImage src={staticFile("animation.gif")} width={500} height={500} loopBehavior="pause-after-finish" />
```

## Styling

```tsx
<AnimatedImage
  src={staticFile("animation.gif")}
  width={500}
  height={500}
  style={{ borderRadius: 20, position: "absolute", top: 100, left: 50 }}
/>
```

## Alternative: `<Gif>` from @remotion/gif

If `<AnimatedImage>` does not work, use `<Gif>` from `@remotion/gif` instead:

```tsx
import { Gif } from "@remotion/gif";
import { staticFile } from "remotion";

<Gif src={staticFile("animation.gif")} width={500} height={500} />;
```
