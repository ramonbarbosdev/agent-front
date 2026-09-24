/** Código do assistente na API (ex.: HORAS_EXTRAS). */
export type AssistantType = string;

export type ChatRole = "user" | "assistant";

export interface AssistantListItem {
  code: AssistantType;
  name: string;
  description: string;
  active: boolean;
}

export interface AssistantConfig {
  code: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string | null;
  active: boolean;
  ragInject: boolean;
  ragTopK: number;
  tools: string[];
}

export interface AssistantUpsertRequest {
  code?: string;
  name: string;
  description?: string;
  systemPrompt: string;
  prependBasePrompt?: boolean;
  model?: string;
  active?: boolean;
  ragInject?: boolean;
  ragTopK?: number;
  tools?: string[];
}

export interface ToolCatalogEntry {
  name: string;
  description: string;
  kind: ToolKind;
}

export interface AgentChatRequest {
  assistant: AssistantType;
  message: string;
  conversationId?: string;
}

export type ToolKind = "READ" | "WRITE";

export interface ToolDescriptor {
  name: string;
  description: string;
  kind: ToolKind;
  parametersSchema: Record<string, unknown>;
}

export interface ToolInvokeRequest {
  assistant: AssistantType;
  tool: string;
  arguments: string;
}

export interface ToolInvokeResponse {
  success: boolean;
  content: string;
}

export interface RagDocumentRequest {
  titulo: string;
  fonte: string;
  conteudo: string;
}

export interface RagDocumentResponse {
  documentoId: string;
}

export interface RagSearchHit {
  titulo: string;
  fonte: string;
  conteudo: string;
  score: number;
}

export interface AgentChatResponse {
  message: string;
  conversationId: string;
}

export interface AgentApiErrorBody {
  code?: string;
  message?: string;
}

export interface HealthResponse {
  status: string;
}

export type StatusLevel = "OK" | "WARN" | "ERROR";

export interface StatusCheck {
  id: string;
  level: StatusLevel;
  message: string;
  hint: string | null;
}

export interface LlmStatus {
  provider: string;
  baseUrl: string;
  model: string;
  reachable: boolean;
  modelReady: boolean;
}

export interface AssistantStatus {
  id: string;
  name: string;
  description: string;
  model: string;
  available: boolean;
}

export interface AgentPlatformStatus {
  apiStatus: string;
  ready: boolean;
  llm: LlmStatus;
  activeAssistantId: string | null;
  assistants: AssistantStatus[];
  checks: StatusCheck[];
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}
