import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AssistantSelector } from "@/components/agent/AssistantSelector";
import { AgentAppLayout } from "@/components/agent/AgentAppLayout";
import { ChatWindow } from "@/components/agent/ChatWindow";
import { ChatInput } from "@/components/agent/ChatInput";
import { ConnectionBadges } from "@/components/agent/ConnectionBadges";
import { ConversationIdBadge } from "@/components/agent/ConversationIdBadge";
import { SystemDiagnostics } from "@/components/agent/SystemDiagnostics";
import {
  fetchAssistants,
  fetchConversationMessages,
  fetchPlatformStatus,
  GENERIC_ERROR,
  sendMessage,
} from "@/services/agentApi";
import { streamChatMessage } from "@/services/agentChatSocket";
import {
  getStoredAssistant,
  getStoredConversationId,
  setStoredAssistant,
  setStoredConversationId,
} from "@/lib/conversationStorage";
import {
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const current = assistants.find((a) => a.code === assistant);

  useEffect(() => {
    void (async () => {
      setAssistantsLoading(true);
      try {
        const items = await fetchAssistants(false);
        setAssistants(items);
        if (items.length > 0) {
          const remembered = getStoredAssistant();
          const initial = items.some((i) => i.code === remembered)
            ? remembered!
            : items.some((i) => i.code === assistant)
              ? assistant
              : items[0].code;
          setAssistant(initial);
          setStoredAssistant(initial);
          const stored = getStoredConversationId(initial);
          setConversationId(stored);
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

  const loadHistory = useCallback(async (convId: string) => {
    setHistoryLoading(true);
    try {
      const items = await fetchConversationMessages(convId);
      setMessages(
        items.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        })),
      );
    } catch {
      setError("Não foi possível carregar o histórico desta conversa. Verifique se a API está atualizada.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    if (loading) {
      return;
    }
    void loadHistory(conversationId);
  }, [conversationId, loadHistory, loading]);

  const handleSend = useCallback(
    async (content: string) => {
      if (loading || historyLoading || !content.trim() || !chatReady) return;

      setError(null);

      setMessages((prev) => [
        ...prev,
        { id: createId(), role: "user", content, createdAt: new Date() },
      ]);

      const assistantId = createId();
      setStreamingMessageId(assistantId);
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", createdAt: new Date() },
      ]);
      setLoading(true);

      try {
        const response = await streamChatMessage(
          { assistant, message: content, conversationId },
          {
            onToken: (token) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + token } : m,
                ),
              );
            },
          },
          sendMessage,
        );
        updateConversationId(response.conversationId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: response.message } : m,
          ),
        );
        void refreshStatus();
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError(err instanceof Error && err.message ? err.message : GENERIC_ERROR);
        void refreshStatus();
      } finally {
        setStreamingMessageId(null);
        setLoading(false);
      }
    },
    [assistant, conversationId, loading, historyLoading, chatReady, refreshStatus, updateConversationId],
  );

  const handleAssistantChange = useCallback((value: AssistantType) => {
    setAssistant(value);
    setStoredAssistant(value);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
    const stored = getStoredConversationId(value);
    setConversationId(stored);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    updateConversationId(undefined);
    setError(null);
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
          loading={loading || historyLoading}
          streamInProgress={streamingMessageId !== null}
          streamingMessageId={streamingMessageId}
          error={error}
          statusLoading={statusLoading}
          apiOffline={apiOffline}
          configPending={apiReachable && !chatReady}
          chatDisabled={!chatReady || loading || historyLoading || !assistant}
          platformStatus={platformStatus}
          assistantLabel={current?.name ?? "Assistente"}
          assistantCode={assistant || "DEFAULT"}
          onDismissError={() => setError(null)}
          onSuggestionPick={(text) => void handleSend(text)}
        />
        <ChatInput disabled={loading || !chatReady} onSend={handleSend} />
      </AgentAppLayout>
    </TooltipProvider>
  );
}
