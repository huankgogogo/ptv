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
