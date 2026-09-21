import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "@/types/agent";
import { ChatMessage } from "./ChatMessage";
import { AgentStatus } from "./AgentStatus";

interface Props {
  messages: ChatMessageType[];
  loading: boolean;
  error: string | null;
  apiOffline?: boolean;
  onDismissError: () => void;
}

export function ChatWindow({ messages, loading, error, apiOffline, onDismissError }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
        {apiOffline && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Agent API indisponível. Inicie o backend em{" "}
            <code className="text-xs">localhost:8081</code> e recarregue a página.
          </div>
        )}

        {messages.length === 0 && !loading && !apiOffline && (
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
