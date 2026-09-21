import { env } from "@/config/env";
import type { AgentChatRequest, AgentChatResponse } from "@/types/agent";

export const GENERIC_ERROR =
  "Não foi possível obter uma resposta do assistente. Tente novamente.";

export class AgentApiError extends Error {
  constructor(message: string = GENERIC_ERROR) {
    super(message);
    this.name = "AgentApiError";
  }
}

/**
 * Única porta de comunicação HTTP com a Agent API (Spring Boot).
 */
export async function sendMessage(
  request: AgentChatRequest,
): Promise<AgentChatResponse> {
  const url = `${env.agentApiUrl}/api/agent/chat`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[agentApi] POST ${url} falhou com status ${response.status}`,
        await response.text().catch(() => ""),
      );
      throw new AgentApiError();
    }

    const data = (await response.json().catch((error) => {
      console.error("[agentApi] Resposta não é um JSON válido", error);
      throw new AgentApiError();
    })) as Partial<AgentChatResponse>;

    if (!data || typeof data.message !== "string") {
      console.error("[agentApi] Resposta inválida da Agent API", data);
      throw new AgentApiError();
    }

    return { message: data.message };
  } catch (error) {
    if (error instanceof AgentApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("[agentApi] Timeout ao chamar a Agent API", url);
      throw new AgentApiError();
    }
    console.error("[agentApi] Agent API indisponível ou erro de rede", error);
    throw new AgentApiError();
  } finally {
    clearTimeout(timeout);
  }
}
