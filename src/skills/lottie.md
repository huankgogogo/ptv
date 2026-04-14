---
name: lottie
description: Embedding Lottie animations in Remotion
metadata:
  category: Animation
---

# Using Lottie Animations in Remotion

## Displaying a Lottie file

Fetch the Lottie asset, wrap loading in `delayRender()` and `continueRender()`, then render with the `Lottie` component:

```tsx
import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

export const MyAnimation = () => {
  const [handle] = useState(() => delayRender("Loading Lottie animation"));

  const [animationData, setAnimationData] =
    useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch("https://assets4.lottiefiles.com/packages/lf20_zyquagfl.json")
      .then((data) => data.json())
      .then((json) => {
        setAnimationData(json);
        continueRender(handle);
      })
      .catch((err) => {
        cancelRender(err);
      });
  }, [handle]);

  if (!animationData) {
    return null;
  }

  return <Lottie animationData={animationData} />;
};
```

## Styling and animating

Lottie supports the `style` prop for styles and animations:

```tsx
return (
  <Lottie animationData={animationData} style={{ width: 400, height: 400 }} />
);
```
