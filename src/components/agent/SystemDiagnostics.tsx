import { RefreshCw } from "lucide-react";
import { env } from "@/config/env";
import type { AgentPlatformStatus, StatusLevel } from "@/types/agent";
import { cn } from "@/lib/utils";

interface Props {
  status: AgentPlatformStatus | null;
  loading: boolean;
  onRefresh: () => void;
}

function levelDot(level: StatusLevel | "UNKNOWN") {
  switch (level) {
    case "OK":
      return "bg-emerald-500";
    case "WARN":
      return "bg-amber-500";
    case "ERROR":
      return "bg-destructive";
    default:
      return "bg-muted-foreground";
  }
}

function SignalRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean | null;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          ok === null ? "bg-muted-foreground" : ok ? "bg-emerald-500" : "bg-destructive",
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export function SystemDiagnostics({ status, loading, onRefresh }: Props) {
  const llm = status?.llm;
  const active = status?.assistants.find((a) => a.id === status.activeAssistantId);

  return (
    <section className="mt-6 space-y-3 rounded-lg border border-border bg-card/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Diagnóstico
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          aria-label="Atualizar diagnóstico"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {status === null && !loading && (
        <p className="text-xs text-destructive">
          Não foi possível contactar a Agent API em{" "}
          <code className="text-[10px]">{env.agentApiDisplayUrl}</code>. Confira CORS na API e
          reinicie o <code className="text-[10px]">npm run dev</code> após alterar o .env.
        </p>
      )}

      {status && (
        <>
          <div
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-medium",
              status.ready
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {status.ready
              ? "Pronto para conversar"
              : "Configuração pendente — veja os itens abaixo"}
          </div>

          <div className="space-y-2.5 border-b border-border pb-3">
            <SignalRow
              label="Agent API"
              ok={status.apiStatus === "UP"}
              detail={status.apiStatus === "UP" ? "Conectada" : "Indisponível"}
            />
            <SignalRow
              label="Ollama (LLM)"
              ok={llm?.reachable ?? false}
              detail={
                llm?.reachable
                  ? `Conectado em ${llm.baseUrl}`
                  : `Sem conexão em ${llm?.baseUrl ?? "—"}`
              }
            />
            <SignalRow
              label="Modelo"
              ok={llm?.modelReady ?? false}
              detail={llm ? `${llm.model} (${llm.provider})` : "—"}
            />
            <SignalRow
              label="Agente ativo"
              ok={active?.available ?? false}
              detail={
                active
                  ? `${active.name} · ${active.id}`
                  : status.activeAssistantId ?? "Nenhum selecionado"
              }
            />
          </div>

          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {status.checks.map((check) => (
              <li key={check.id} className="text-xs">
                <div className="flex items-start gap-2">
                  <span
                    className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", levelDot(check.level))}
                    aria-hidden
                  />
                  <div>
                    <p className="text-foreground">{check.message}</p>
                    {check.hint && (
                      <p className="mt-0.5 text-muted-foreground">
                        <span className="font-medium">Ação:</span> {check.hint}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
