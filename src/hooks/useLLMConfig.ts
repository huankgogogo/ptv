"use client";

import type { LLMConfig } from "@/types/generation";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ptv_llm_config";

const DEFAULT_CONFIG: LLMConfig = {
  baseURL: "",
  apiKey: "",
  model: "",
};

function readFromStorage(): LLMConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CONFIG;
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    return {
      baseURL: String(parsed.baseURL ?? ""),
      apiKey: String(parsed.apiKey ?? ""),
      model: String(parsed.model ?? ""),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useLLMConfig(): {
  config: LLMConfig;
  setConfig: (config: LLMConfig) => void;
  isConfigured: boolean;
} {
  const [config, setConfigState] = useState<LLMConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setConfigState(readFromStorage());
  }, []);

  const setConfig = useCallback((newConfig: LLMConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setConfigState(newConfig);
  }, []);

  const isConfigured =
    config.baseURL.trim() !== "" &&
    config.apiKey.trim() !== "" &&
    config.model.trim() !== "";

  return { config, setConfig, isConfigured };
}
