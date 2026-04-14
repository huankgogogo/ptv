---
name: article-content
description: Patterns for generating animations based on real article or web page content. Use when a "REFERENCE CONTENT FROM URL" section is present in the prompt.
metadata:
  tags: article, news, url, web-content, infographic, data-extraction, text-content, blog, report
---

# Article Content Animation

When a `## REFERENCE CONTENT FROM URL (MUST USE):` section is present, the animation MUST be built around the actual content from that source.

## Content Extraction Rules

Before writing any code, mentally extract from the article:
1. **Headline / title** — use as the main display text
2. **Key statistics or numbers** — animate as counters or chart data
3. **Key quotes** — show as pull quotes with animation
4. **Main topics / keywords** — use as visual labels or tags
5. **Author / publication / date** — show as metadata if relevant

Never use placeholder text like "Lorem ipsum" or "Your title here" when article content is available.

## Layout Patterns

### News Headline Reveal
Good for: breaking news, article summaries, announcements

```tsx
// Use ACTUAL headline from article as HEADLINE_TEXT
const HEADLINE_TEXT = "Put the real article headline here";
const SUBHEADLINE = "Put the real subheadline or first sentence here";
const SOURCE = "Publication Name · Date";

const headlineProgress = spring({ frame, fps, config: { damping: 200 } });
const subProgress = spring({ frame: frame - 15, fps, config: { damping: 200 } });

<AbsoluteFill style={{ backgroundColor: "#0a0a0a", padding: 80 }}>
  <div style={{
    transform: `translateY(${interpolate(headlineProgress, [0,1], [40, 0])}px)`,
    opacity: headlineProgress,
    fontSize: 64, fontWeight: 800, color: "#ffffff", lineHeight: 1.1
  }}>
    {HEADLINE_TEXT}
  </div>
  <div style={{ opacity: subProgress, fontSize: 28, color: "#999", marginTop: 24 }}>
    {SUBHEADLINE}
  </div>
  <div style={{ position: "absolute", bottom: 60, left: 80, fontSize: 18, color: "#555" }}>
    {SOURCE}
  </div>
</AbsoluteFill>
```

### Stat Counter
Good for: articles with key numbers, reports, data journalism

```tsx
// Use ACTUAL numbers from the article
const STATS = [
  { value: 42, label: "Real metric from article", suffix: "%" },
  { value: 1200, label: "Another real metric", suffix: "K" },
];

// Animate value counting up
const animatedValue = Math.round(
  interpolate(frame, [delay, delay + fps * 1.5], [0, stat.value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  })
);
```

### Pull Quote
Good for: interview articles, opinion pieces, notable statements

```tsx
// Use an ACTUAL quote from the article
const QUOTE_TEXT = "The exact quote from the article goes here";
const QUOTE_AUTHOR = "Person Name, Their Title";

const quoteOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
const lineWidth = interpolate(frame, [10, 40], [0, 6], { extrapolateRight: "clamp" });

<AbsoluteFill style={{ backgroundColor: "#111", justifyContent: "center", padding: 100 }}>
  <div style={{ width: lineWidth, height: 80, backgroundColor: "#e63946", marginBottom: 32 }} />
  <div style={{ opacity: quoteOpacity, fontSize: 44, color: "#fff", fontStyle: "italic", lineHeight: 1.4 }}>
    "{QUOTE_TEXT}"
  </div>
  <div style={{ opacity: quoteOpacity, marginTop: 32, fontSize: 22, color: "#888" }}>
    — {QUOTE_AUTHOR}
  </div>
</AbsoluteFill>
```

### Key Points List
Good for: listicles, how-tos, summaries with multiple takeaways

```tsx
// Use ACTUAL points from the article
const KEY_POINTS = [
  "First real point from the article",
  "Second real point from the article",
  "Third real point from the article",
];

const STAGGER = 18;

{KEY_POINTS.map((point, i) => {
  const itemProgress = spring({
    frame: frame - i * STAGGER,
    fps,
    config: { damping: 200 },
  });
  return (
    <div style={{
      opacity: itemProgress,
      transform: `translateX(${interpolate(itemProgress, [0, 1], [-30, 0])}px)`,
      display: "flex", alignItems: "center", gap: 20, marginBottom: 24
    }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#e63946", flexShrink: 0 }} />
      <span style={{ fontSize: 32, color: "#fff" }}>{point}</span>
    </div>
  );
})}
```

## Choosing the Right Layout

| Article type | Recommended layout |
|---|---|
| Breaking news / announcement | News Headline Reveal |
| Data report / research | Stat Counter + charts skill |
| Interview / opinion | Pull Quote |
| How-to / listicle | Key Points List |
| Mixed content | Combine layouts with Sequence |

## Multi-Scene Article Summary

For longer articles, use `Sequence` to create multiple scenes — each covering one key aspect:

```tsx
<>
  <Sequence from={0} durationInFrames={90}>
    {/* Scene 1: headline */}
  </Sequence>
  <Sequence from={90} durationInFrames={90}>
    {/* Scene 2: key stat or quote */}
  </Sequence>
  <Sequence from={180} durationInFrames={90}>
    {/* Scene 3: conclusion or CTA */}
  </Sequence>
</>
```
