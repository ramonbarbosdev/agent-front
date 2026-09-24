import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AssistantSelector } from "@/components/agent/AssistantSelector";
import { AgentAppLayout } from "@/components/agent/AgentAppLayout";
import { ChatWindow } from "@/components/agent/ChatWindow";
import { ChatInput } from "@/components/agent/ChatInput";
import { ConnectionBadges } from "@/components/agent/ConnectionBadges";
import { ConversationIdBadge } from "@/components/agent/ConversationIdBadge";
import { SystemDiagnostics } from "@/components/agent/SystemDiagnostics";
import { fetchAssistants, fetchPlatformStatus, GENERIC_ERROR, sendMessage } from "@/services/agentApi";
import {
  getStoredConversationId,
  setStoredConversationId,
} from "@/lib/conversationStorage";
import {
  assistantIcon,
  type AgentPlatformStatus,
  type AssistantListItem,
  type AssistantType,
  type ChatMessage,
} from "@/types/agent";
import { TooltipProvider } from "@/components/ui/tooltip";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

export function AgentPlayground() {
  const [assistants, setAssistants] = useState<AssistantListItem[]>([]);
  const [assistantsLoading, setAssistantsLoading] = useState(true);
  const [assistant, setAssistant] = useState<AssistantType>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<AgentPlatformStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [restoredThread, setRestoredThread] = useState(false);

  const current = assistants.find((a) => a.code === assistant);

  useEffect(() => {
    void (async () => {
      setAssistantsLoading(true);
      try {
        const items = await fetchAssistants(false);
        setAssistants(items);
        if (items.length > 0) {
          const initial = items.some((i) => i.code === assistant)
            ? assistant
            : items[0].code;
          setAssistant(initial);
          const stored = getStoredConversationId(initial);
          setConversationId(stored);
          setRestoredThread(Boolean(stored));
        }
      } finally {
        setAssistantsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once
  }, []);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    const status = await fetchPlatformStatus(assistant);
    setPlatformStatus(status);
    setStatusLoading(false);
  }, [assistant]);

  useEffect(() => {
    void refreshStatus();
    const interval = window.setInterval(() => void refreshStatus(), 30_000);
    return () => window.clearInterval(interval);
  }, [refreshStatus]);

  const apiReachable = platformStatus !== null;
  const apiOffline = !statusLoading && platformStatus === null;
  const chatReady = platformStatus?.ready === true;

  const updateConversationId = useCallback(
    (id: string | undefined) => {
      setConversationId(id);
      setStoredConversationId(assistant, id);
    },
    [assistant],
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (loading || !content.trim() || !chatReady) return;

      setError(null);
      setRestoredThread(false);

      setMessages((prev) => [
        ...prev,
        { id: createId(), role: "user", content, createdAt: new Date() },
      ]);
      setLoading(true);

      try {
        const response = await sendMessage({
          assistant,
          message: content,
          conversationId,
        });
        updateConversationId(response.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            content: response.message,
            createdAt: new Date(),
          },
        ]);
        void refreshStatus();
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : GENERIC_ERROR);
        void refreshStatus();
      } finally {
        setLoading(false);
      }
    },
    [assistant, conversationId, loading, chatReady, refreshStatus, updateConversationId],
  );

  const handleAssistantChange = useCallback((value: AssistantType) => {
    setAssistant(value);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
    const stored = getStoredConversationId(value);
    setConversationId(stored);
    setRestoredThread(Boolean(stored));
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    updateConversationId(undefined);
    setError(null);
    setRestoredThread(false);
  }, [updateConversationId]);

  return (
    <TooltipProvider delayDuration={300}>
      <AgentAppLayout
        activeNav="playground"
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        sidebarBody={
          <>
            <AssistantSelector
              assistants={assistants}
              loading={assistantsLoading}
              selected={assistant}
              onSelect={handleAssistantChange}
            />
            <SystemDiagnostics
              status={platformStatus}
              loading={statusLoading}
              onRefresh={() => void refreshStatus()}
            />
          </>
        }
        header={
          <>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold">{current?.name ?? "Assistente"}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {platformStatus?.llm.model
                  ? `Agente ${assistant} · modelo ${platformStatus.llm.model}`
                  : current?.description}
              </p>
            </div>
            <ConversationIdBadge conversationId={conversationId} />
            <div className="flex flex-wrap items-center gap-1.5">
              <ConnectionBadges status={platformStatus} />
            </div>
            <button
              type="button"
              onClick={clearConversation}
              disabled={messages.length === 0 && !conversationId && !loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar conversa
            </button>
          </>
        }
      >
        <ChatWindow
          messages={messages}
          loading={loading}
          error={error}
          statusLoading={statusLoading}
          apiOffline={apiOffline}
          configPending={apiReachable && !chatReady}
          chatDisabled={!chatReady || loading || !assistant}
          platformStatus={platformStatus}
          assistantLabel={current?.name ?? "Assistente"}
          assistantIcon={assistant ? assistantIcon(assistant) : "🤖"}
          restoredThreadBanner={
            restoredThread && messages.length === 0
              ? "Conversa retomada pelo ID salvo nesta sessão. O histórico completo está no servidor; envie uma mensagem para continuar."
              : undefined
          }
          onDismissError={() => setError(null)}
          onSuggestionPick={(text) => void handleSend(text)}
        />
        <ChatInput disabled={loading || !chatReady} onSend={handleSend} />
      </AgentAppLayout>
    </TooltipProvider>
  );
}
