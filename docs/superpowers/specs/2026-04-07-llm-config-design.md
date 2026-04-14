# 设计文档：用户可配置 LLM URL、API Key、Model

**日期：** 2026-04-07  
**状态：** 待实现

---

## 背景

当前项目从服务端 `OPENAI_API_KEY` 环境变量读取 API key，模型列表硬编码为 `MODELS` 常量。  
目标是让用户自行填写 LLM Base URL、API Key 和 Model 名称，完全移除 env 依赖和下拉列表。

---

## 决策

| 问题 | 决策 |
|------|------|
| 存储位置 | localStorage（key: `ptv_llm_config`） |
| UI 入口 | Header 右侧独立按钮 → Dialog |
| 服务端 env 备选 | 不使用，若用户未配置则返回 400 |
| 模型选择 | 移除 MODELS 下拉列表，改为 Modal 中自由输入 |

---

## 架构

```
LLMSettingsModal (Header 右侧)
    ↓ 读写
useLLMConfig (localStorage hook)
    ↓ 提供 config
useGenerationApi → fetch body: { llmBaseURL, llmApiKey, llmModel }
    ↓
/api/generate → createOpenAI({ baseURL, apiKey }) + model 名称
```

---

## 各层设计

### 1. 类型（`src/types/generation.ts`）

移除：
- `MODELS` 常量
- `ModelId` 类型

保留：
- `StreamPhase`
- `GenerationErrorType`

新增：
```ts
export interface LLMConfig {
  baseURL: string;   // e.g. "https://api.openai.com/v1"
  apiKey: string;
  model: string;     // e.g. "gpt-4o"
}
```

### 2. Hook（`src/hooks/useLLMConfig.ts`）

```ts
const STORAGE_KEY = "ptv_llm_config";

export function useLLMConfig(): {
  config: LLMConfig;
  setConfig: (config: LLMConfig) => void;
  isConfigured: boolean;   // baseURL + apiKey + model 均非空
}
```

- 初始读 localStorage，若无则返回空字符串默认值
- `setConfig` 写 localStorage 并更新 state

### 3. UI（`src/components/LLMSettingsModal.tsx`）

新增独立组件，包含触发按钮 + Dialog：

- 触发按钮：`Settings` 图标 + "API Settings" 文字
- 若 `!isConfigured`：按钮加橙色 `AlertCircle` 图标提示
- Dialog 内三个字段：
  - Base URL（placeholder: `https://api.openai.com/v1`）
  - API Key（type=password，有显示/隐藏切换）
  - Model（placeholder: `gpt-4o`）
- Save 时调用 `setConfig`，Close 关闭 Dialog

### 4. PageLayout（`src/components/PageLayout.tsx`）

- 在 header 右侧渲染 `<LLMSettingsModal />`（取代原 `rightContent` slot，或与其共存）
- 无需向下传递配置，Modal 自己持有状态

### 5. 请求传递（`src/hooks/useGenerationApi.ts`）

- `runGeneration` 接受额外参数 `llmConfig: LLMConfig`
- 将 `llmBaseURL`、`llmApiKey`、`llmModel` 加入 fetch body

### 6. 服务端（`src/app/api/generate/route.ts`）

- 从 body 解构 `llmBaseURL`、`llmApiKey`、`llmModel`
- 若任一为空，返回 400 + 提示用户配置 API Settings
- 移除 `process.env.OPENAI_API_KEY` 读取
- `createOpenAI({ baseURL: llmBaseURL, apiKey: llmApiKey })`
- 将 `modelName` 替换为 `llmModel`（移除原 model.split(":") reasoning effort 逻辑，简化为直接用 `llmModel`）

### 7. 移除 model 相关代码

- `ChatInput.tsx`：移除 model Select 下拉及相关 props
- `ChatSidebar.tsx`：移除 `model` state、`MODELS` import，不再向 `ChatInput` 传 model
- `ChatSidebar.tsx`：`runGeneration` 中 model 改从 `useLLMConfig` 读取
- `LandingPageInput.tsx`：移除 model Select 下拉
- `page.tsx`（home）：`handleNavigate` 不再接收 model 参数，URL params 中移除 model
- `generate/page.tsx`：无需改动（已不读取 model URL param）

---

## 受影响文件

| 文件 | 变更类型 |
|------|---------|
| `src/types/generation.ts` | 修改：移除 MODELS/ModelId，加 LLMConfig |
| `src/hooks/useLLMConfig.ts` | 新增 |
| `src/components/LLMSettingsModal.tsx` | 新增 |
| `src/components/PageLayout.tsx` | 修改：加 LLMSettingsModal |
| `src/hooks/useGenerationApi.ts` | 修改：传 llmConfig |
| `src/app/api/generate/route.ts` | 修改：用 client config |
| `src/components/ChatSidebar/ChatSidebar.tsx` | 修改：移除 model state |
| `src/components/ChatSidebar/ChatInput.tsx` | 修改：移除 model Select |
| `src/components/LandingPageInput.tsx` | 修改：移除 model Select |
| `src/app/page.tsx` | 修改：移除 model 参数 |

---

## 错误处理

- 用户未配置时：服务端返回 400，前端展示 "请先在 API Settings 中配置 LLM 信息"
- API key 无效时：OpenAI 返回 401，前端展示通用 API 错误

---

## 不在范围内

- Model 的 reasoning_effort 参数（原 `model:reasoningEffort` 格式，移除）
- 服务端 session 管理
- 多用户隔离
