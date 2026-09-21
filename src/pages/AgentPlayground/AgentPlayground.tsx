import { useCallback, useEffect, useState } from "react";
import { Menu, Trash2, X } from "lucide-react";
import { AssistantSelector } from "@/components/agent/AssistantSelector";
import { ChatWindow } from "@/components/agent/ChatWindow";
import { ChatInput } from "@/components/agent/ChatInput";
import { ConnectionBadges } from "@/components/agent/ConnectionBadges";
import { SystemDiagnostics } from "@/components/agent/SystemDiagnostics";
import { fetchPlatformStatus, GENERIC_ERROR, sendMessage } from "@/services/agentApi";
import {
  ASSISTANTS,
  type AgentPlatformStatus,
  type AssistantType,
  type ChatMessage,
} from "@/types/agent";
import { cn } from "@/lib/utils";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

export function AgentPlayground() {
  const [assistant, setAssistant] = useState<AssistantType>("HORAS_EXTRAS");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<AgentPlatformStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const current = ASSISTANTS.find((a) => a.id === assistant);

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

  const handleSend = useCallback(
    async (content: string) => {
      if (loading || !content.trim() || !chatReady) return;

      setError(null);
      const history = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      setMessages((prev) => [
        ...prev,
        { id: createId(), role: "user", content, createdAt: new Date() },
      ]);
      setLoading(true);

      try {
        const response = await sendMessage({ assistant, message: content, history });
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
    [assistant, loading, messages, chatReady, refreshStatus],
  );

  const handleAssistantChange = useCallback((value: AssistantType) => {
    setAssistant(value);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border bg-sidebar p-4 transition-transform md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Agent Platform</span>
          <button
            type="button"
            className="md:hidden"
            aria-label="Fechar menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <AssistantSelector selected={assistant} onSelect={handleAssistantChange} />

        <SystemDiagnostics
          status={platformStatus}
          loading={statusLoading}
          onRefresh={() => void refreshStatus()}
        />

        <p className="mt-auto pt-4 text-[11px] text-muted-foreground">Agent Playground · MVP</p>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
          <button
            type="button"
            className="md:hidden"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{current?.label}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {platformStatus?.llm.model
                ? `Agente ${assistant} · modelo ${platformStatus.llm.model}`
                : current?.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <ConnectionBadges status={platformStatus} />
          </div>
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            disabled={messages.length === 0 || loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpar conversa
          </button>
        </header>

        <ChatWindow
          messages={messages}
          loading={loading}
          error={error}
          statusLoading={statusLoading}
          apiOffline={apiOffline}
          configPending={apiReachable && !chatReady}
          platformStatus={platformStatus}
          onDismissError={() => setError(null)}
        />
        <ChatInput disabled={loading || !chatReady} onSend={handleSend} />
      </main>
    </div>
  );
}
