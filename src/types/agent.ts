export type AssistantType = "HORAS_EXTRAS";

export type ChatRole = "user" | "assistant";

export interface Assistant {
  id: AssistantType | string;
  label: string;
  icon: string;
  description: string;
  available: boolean;
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

export const ASSISTANTS: Assistant[] = [
  {
    id: "HORAS_EXTRAS",
    label: "Horas Extras",
    icon: "🤖",
    description: "Consultas sobre horas extras da equipe",
    available: true,
  },
  { id: "FINANCEIRO", label: "Financeiro", icon: "💰", description: "Em breve", available: false },
  { id: "SUPORTE", label: "Suporte", icon: "🎧", description: "Em breve", available: false },
  { id: "RH", label: "RH", icon: "👥", description: "Em breve", available: false },
];
