import { env } from "@/config/env";
import type {
  AgentApiErrorBody,
  AgentChatRequest,
  AgentChatResponse,
  AgentPlatformStatus,
  AssistantType,
  HealthResponse,
} from "@/types/agent";

export const GENERIC_ERROR =
  "Não foi possível obter uma resposta do assistente. Tente novamente.";

export class AgentApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string = GENERIC_ERROR, status?: number, code?: string) {
    super(message);
    this.name = "AgentApiError";
    this.status = status;
    this.code = code;
  }
}

function apiUrl(path: string): string {
  const base = env.agentApiUrl;
  return base ? `${base}${path}` : path;
}

async function parseErrorResponse(response: Response): Promise<AgentApiError> {
  try {
    const body = (await response.json()) as AgentApiErrorBody;
    if (body?.message) {
      return new AgentApiError(body.message, response.status, body.code);
    }
  } catch {
    // ignore invalid JSON
  }
  return new AgentApiError(GENERIC_ERROR, response.status);
}

/**
 * Única porta de comunicação HTTP com a Agent API (Spring Boot).
 */
export async function sendMessage(
  request: AgentChatRequest,
): Promise<AgentChatResponse> {
  const url = apiUrl("/api/agent/chat");
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
        await response.clone().text().catch(() => ""),
      );
      throw await parseErrorResponse(response);
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
      throw new AgentApiError(
        "A resposta demorou mais que o esperado. Na primeira pergunta o modelo pode levar vários minutos — tente de novo ou aumente OLLAMA_TIMEOUT na API.",
      );
    }
    console.error("[agentApi] Agent API indisponível ou erro de rede", error);
    throw new AgentApiError(
      "Não foi possível conectar à Agent API. Verifique se o backend está em execução.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkHealth(): Promise<boolean> {
  const url = apiUrl("/api/agent/health");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const data = (await response.json()) as Partial<HealthResponse>;
    return data?.status === "UP";
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPlatformStatus(
  assistant?: AssistantType,
): Promise<AgentPlatformStatus | null> {
  const query = assistant ? `?assistant=${encodeURIComponent(assistant)}` : "";
  const url = apiUrl(`/api/agent/status${query}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`[agentApi] GET ${url} status ${response.status}`);
      return null;
    }
    return (await response.json()) as AgentPlatformStatus;
  } catch (error) {
    console.error("[agentApi] Falha ao carregar diagnóstico", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
