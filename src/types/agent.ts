export type AssistantType = "HORAS_EXTRAS";

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
}

export interface AgentChatResponse {
  message: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
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
