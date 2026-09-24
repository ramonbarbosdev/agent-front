import { isToday, isYesterday, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { env } from "@/config/env";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatScrollArea } from "./ChatScrollArea";
import type { AgentPlatformStatus, ChatMessage as ChatMessageType } from "@/types/agent";
import { ChatMessage } from "./ChatMessage";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import { AgentStatus } from "./AgentStatus";

interface Props {
  messages: ChatMessageType[];
  loading: boolean;
  error: string | null;
  statusLoading?: boolean;
  apiOffline?: boolean;
  configPending?: boolean;
  chatDisabled?: boolean;
  streamInProgress?: boolean;
  platformStatus?: AgentPlatformStatus | null;
  assistantLabel: string;
  assistantCode: string;
  restoredThreadBanner?: string;
  onDismissError: () => void;
  onSuggestionPick: (text: string) => void;
}

function formatDayLabel(date: Date): string {
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

function groupMessagesByDay(messages: ChatMessageType[]) {
  const groups: { label: string; items: ChatMessageType[] }[] = [];
  for (const message of messages) {
    const label = formatDayLabel(message.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) {
      last.items.push(message);
    } else {
      groups.push({ label, items: [message] });
    }
  }
  return groups;
}

export function ChatWindow({
  messages,
  loading,
  error,
  statusLoading,
  apiOffline,
  configPending,
  chatDisabled,
  streamInProgress,
  platformStatus,
  assistantLabel,
  assistantCode,
  restoredThreadBanner,
  onDismissError,
  onSuggestionPick,
}: Props) {
  const pendingHint = platformStatus?.checks.find((c) => c.level === "ERROR")?.hint;
  const groups = groupMessagesByDay(messages);

  const showEmpty =
    messages.length === 0 && !loading && !statusLoading && !apiOffline && !configPending;

  return (
    <ChatScrollArea>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        {statusLoading && (
          <Alert>
            <AlertDescription>Verificando conexão com a Agent API…</AlertDescription>
          </Alert>
        )}

        {apiOffline && (
          <Alert variant="destructive">
            <AlertDescription>
              Agent API indisponível. Confira se o backend está rodando (
              <code className="text-xs">{env.agentApiDisplayUrl}</code>) e recarregue a página.
            </AlertDescription>
          </Alert>
        )}

        {configPending && (
          <Alert className="border-amber-500/40 bg-amber-500/5 text-amber-950 dark:text-amber-100">
            <AlertDescription>
              A API está no ar, mas o chat ainda não está pronto. Veja o diagnóstico na barra
              lateral.
              {pendingHint && (
                <span className="mt-2 block text-xs opacity-90">
                  <span className="font-medium">Sugestão:</span> {pendingHint}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {restoredThreadBanner && (
          <Alert>
            <AlertDescription>{restoredThreadBanner}</AlertDescription>
          </Alert>
        )}

        {showEmpty && (
          <ChatEmptyState disabled={!!chatDisabled} onPick={onSuggestionPick} />
        )}

        {groups.map((group) => (
          <div key={group.label} className="space-y-4">
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            {group.items.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                assistantLabel={assistantLabel}
                assistantCode={assistantCode}
              />
            ))}
          </div>
        ))}

        {loading && !streamInProgress && (
          <ChatTypingIndicator assistantLabel={assistantLabel} assistantCode={assistantCode} />
        )}

        <AgentStatus loading={false} error={error} onRetryDismiss={onDismissError} />
        <div className="h-4 shrink-0" aria-hidden />
      </div>
    </ChatScrollArea>
  );
}
