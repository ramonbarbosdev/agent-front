import { ASSISTANTS, type AssistantType } from "@/types/agent";
import { cn } from "@/lib/utils";

interface Props {
  selected: AssistantType;
  onSelect: (assistant: AssistantType) => void;
}

export function AssistantSelector({ selected, onSelect }: Props) {
  return (
    <nav className="space-y-1">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Assistentes
      </p>
      {ASSISTANTS.map((assistant) => {
        const isSelected = assistant.available && assistant.id === selected;
        return (
          <button
            key={assistant.id}
            type="button"
            disabled={!assistant.available}
            onClick={() => onSelect(assistant.id as AssistantType)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              isSelected
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              !assistant.available && "cursor-not-allowed opacity-45 hover:bg-transparent",
            )}
          >
            <span aria-hidden className="text-base">
              {assistant.icon}
            </span>
            <span className="flex-1 truncate">{assistant.label}</span>
            {!assistant.available && (
              <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px]">
                em breve
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
