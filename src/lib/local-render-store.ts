// Global in-memory store for local renders
// Using a global to persist across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var localRenderStore: Map<string, LocalRender> | undefined;
}

export interface LocalRender {
  filePath: string;
  size: number;
}

export const localRenderStore: Map<string, LocalRender> =
  global.localRenderStore ?? (global.localRenderStore = new Map());
