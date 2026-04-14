"use client";

import { LandingPageInput } from "@/components/LandingPageInput";
import { PageLayout } from "@/components/PageLayout";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Home: NextPage = () => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = (prompt: string, attachedImages?: string[], urlContent?: string) => {
    setIsNavigating(true);
    if (attachedImages && attachedImages.length > 0) {
      sessionStorage.setItem(
        "initialAttachedImages",
        JSON.stringify(attachedImages),
      );
    } else {
      sessionStorage.removeItem("initialAttachedImages");
    }
    if (urlContent) {
      sessionStorage.setItem("initialUrlContent", urlContent);
    } else {
      sessionStorage.removeItem("initialUrlContent");
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
