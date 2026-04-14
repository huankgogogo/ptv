---
name: videos
description: Embedding videos in Remotion - trimming, volume, speed, looping, pitch
metadata:
  tags: video, media, trim, volume, speed, loop, pitch
---

# Using videos in Remotion

Use `<Video>` from `remotion` to embed videos into your composition.

```tsx
import { Video, staticFile } from "remotion";

export const MyComposition = () => {
  return <Video src={staticFile("video.mp4")} />;
};
```

Remote URLs are also supported:

```tsx
<Video src="https://remotion.media/video.mp4" />
```

## Trimming

Use `startFrom` and `endAt` to trim the video. Values are in frames.

```tsx
const { fps } = useVideoConfig();

return (
  <Video
    src={staticFile("video.mp4")}
    startFrom={2 * fps}  // Skip the first 2 seconds
    endAt={10 * fps}     // End at the 10 second mark
  />
);
```

## Delaying

Wrap the video in a `<Sequence>` to delay when it appears:

```tsx
import { Sequence, Video, staticFile } from "remotion";

const { fps } = useVideoConfig();

return (
  <Sequence from={1 * fps}>
    <Video src={staticFile("video.mp4")} />
  </Sequence>
);
```

## Sizing and Position

Use the `style` prop to control size and position:

```tsx
<Video
  src={staticFile("video.mp4")}
  style={{
    width: 500,
    height: 300,
    position: "absolute",
    top: 100,
    left: 50,
    objectFit: "cover",
  }}
/>
```

## Volume

Set a static volume (0 to 1):

```tsx
<Video src={staticFile("video.mp4")} volume={0.5} />
```

Dynamic volume with fade-in:

```tsx
import { interpolate } from "remotion";

const { fps } = useVideoConfig();

<Video
  src={staticFile("video.mp4")}
  volume={(f) =>
    interpolate(f, [0, 1 * fps], [0, 1], { extrapolateRight: "clamp" })
  }
/>
```

Use `muted` to silence entirely:

```tsx
<Video src={staticFile("video.mp4")} muted />
```

## Speed

```tsx
<Video src={staticFile("video.mp4")} playbackRate={2} />   {/* 2x speed */}
<Video src={staticFile("video.mp4")} playbackRate={0.5} /> {/* Half speed */}
```

## Looping

```tsx
<Video src={staticFile("video.mp4")} loop />
```
