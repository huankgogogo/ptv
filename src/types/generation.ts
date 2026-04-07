export type StreamPhase = "idle" | "reasoning" | "generating";

export type GenerationErrorType = "validation" | "api";

export interface LLMConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}
