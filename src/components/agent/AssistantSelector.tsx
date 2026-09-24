import type { AssistantListItem, AssistantType } from "@/types/agent";
import { AssistantIcon } from "@/lib/assistant-icons";
import { cn } from "@/lib/utils";

interface Props {
  assistants: AssistantListItem[];
  selected: AssistantType;
  onSelect: (assistant: AssistantType) => void;
  loading?: boolean;
}

export function AssistantSelector({ assistants, selected, onSelect, loading }: Props) {
  return (
    <nav className="space-y-1">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Assistentes
      </p>
      {loading && (
        <p className="px-3 text-xs text-muted-foreground">Carregando assistentes…</p>
      )}
      {!loading && assistants.length === 0 && (
        <p className="px-3 text-xs text-muted-foreground">
          Nenhum assistente ativo. Crie um em Assistentes.
        </p>
      )}
      {assistants
        .filter((a) => a.active)
        .map((assistant) => {
          const isSelected = assistant.code === selected;
          return (
            <button
              key={assistant.code}
              type="button"
              onClick={() => onSelect(assistant.code)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                isSelected
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background"
              >
                <AssistantIcon code={assistant.code} className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="flex-1 truncate">{assistant.name}</span>
            </button>
          );
        })}
    </nav>
  );
}
