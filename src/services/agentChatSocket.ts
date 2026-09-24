import { env } from "@/config/env";
import type { AgentChatRequest, AgentChatResponse, AgentChatStreamEvent } from "@/types/agent";
import { AgentApiError, GENERIC_ERROR } from "@/services/agentApi";

function websocketOrigin(): string {
  const raw = env.agentApiUrl || env.agentApiDisplayUrl;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  const url = new URL(withScheme);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.origin;
}

export interface StreamChatHandlers {
  onToken: (token: string) => void;
  onPhase?: (message: string) => void;
}

/**
 * Chat via WebSocket com tokens em tempo real. Faz fallback para HTTP se o socket não abrir.
 */
export async function streamChatMessage(
  request: AgentChatRequest,
  handlers: StreamChatHandlers,
  httpFallback: (req: AgentChatRequest) => Promise<AgentChatResponse>,
): Promise<AgentChatResponse> {
  const wsUrl = `${websocketOrigin()}/ws/agent/chat`;

  return await new Promise<AgentChatResponse>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        fn();
      }
    };

    const timeout = window.setTimeout(() => {
      try {
        ws.close();
      } catch {
        // ignore
      }
      finish(() =>
        reject(
          new AgentApiError(
            "A resposta demorou mais que o esperado. Na primeira pergunta o modelo pode levar vários minutos.",
          ),
        ),
      );
    }, env.requestTimeoutMs);

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      finish(() => {
        void httpFallback(request).then(resolve).catch(reject);
      });
      return;
    }

    const failToHttp = () => {
      finish(() => {
        void httpFallback(request).then(resolve).catch(reject);
      });
    };

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          assistant: request.assistant,
          message: request.message,
          conversationId: request.conversationId,
        }),
      );
    };

    ws.onerror = () => {
      if (!settled) {
        failToHttp();
      }
    };

    ws.onclose = (ev) => {
      if (!settled && ev.code !== 1000) {
        failToHttp();
      }
    };

    ws.onmessage = (event) => {
      let data: AgentChatStreamEvent;
      try {
        data = JSON.parse(String(event.data)) as AgentChatStreamEvent;
      } catch {
        finish(() => reject(new AgentApiError(GENERIC_ERROR)));
        ws.close();
        return;
      }

      switch (data.type) {
        case "token":
          handlers.onToken(data.content ?? "");
          break;
        case "phase":
          handlers.onPhase?.(data.message ?? "");
          break;
        case "done":
          if (typeof data.message !== "string" || typeof data.conversationId !== "string") {
            finish(() => reject(new AgentApiError(GENERIC_ERROR)));
          } else {
            finish(() => resolve({ message: data.message, conversationId: data.conversationId }));
          }
          ws.close();
          break;
        case "error":
          finish(() =>
            reject(new AgentApiError(data.message ?? GENERIC_ERROR, undefined, data.code)),
          );
          ws.close();
          break;
        default:
          break;
      }
    };
  });
}
