import { useEffect, useRef } from "react";
import { env } from "@/config/env";
import type { AgentPlatformStatus, ChatMessage as ChatMessageType } from "@/types/agent";
import { ChatMessage } from "./ChatMessage";
import { AgentStatus } from "./AgentStatus";

interface Props {
  messages: ChatMessageType[];
  loading: boolean;
  error: string | null;
  statusLoading?: boolean;
  apiOffline?: boolean;
  configPending?: boolean;
  platformStatus?: AgentPlatformStatus | null;
  onDismissError: () => void;
}

export function ChatWindow({
  messages,
  loading,
  error,
  statusLoading,
  apiOffline,
  configPending,
  platformStatus,
  onDismissError,
}: Props) {
  const pendingHint = platformStatus?.checks.find((c) => c.level === "ERROR")?.hint;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
        {statusLoading && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Verificando conexão com a Agent API…
          </div>
        )}

        {apiOffline && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Agent API indisponível. Confira se o backend está rodando (
            <code className="text-xs">{env.agentApiDisplayUrl}</code>) e recarregue a página.
          </div>
        )}

        {configPending && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            A API está no ar, mas o chat ainda não está pronto. Abra o diagnóstico na barra lateral.
            {pendingHint && (
              <p className="mt-2 text-xs opacity-90">
                <span className="font-medium">Sugestão:</span> {pendingHint}
              </p>
            )}
          </div>
        )}

        {messages.length === 0 && !loading && !statusLoading && !apiOffline && !configPending && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">Comece uma conversa</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pergunte algo como “Quantas horas extras o João fez esse mês?”
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        <AgentStatus loading={loading} error={error} onRetryDismiss={onDismissError} />
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
