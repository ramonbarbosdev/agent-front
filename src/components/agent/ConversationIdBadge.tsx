import { Copy, Check } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ConversationIdBadgeProps {
  conversationId: string | undefined;
}

export function ConversationIdBadge({ conversationId }: ConversationIdBadgeProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!conversationId) return;
    try {
      await navigator.clipboard.writeText(conversationId);
      setCopied(true);
      toast.success("ID da conversa copiado");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }, [conversationId]);

  if (!conversationId) {
    return (
      <span className="hidden text-[10px] text-muted-foreground sm:inline">
        Nova conversa (ID após 1ª resposta)
      </span>
    );
  }

  const short = `${conversationId.slice(0, 8)}…`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex max-w-[10rem] items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted sm:max-w-none"
        >
          <span className="truncate">conv {short}</span>
          {copied ? (
            <Check className="h-3 w-3 shrink-0 text-green-600" />
          ) : (
            <Copy className="h-3 w-3 shrink-0" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs break-all font-mono text-xs">
        {conversationId}
        <p className="mt-1 font-sans text-muted-foreground">Clique para copiar</p>
      </TooltipContent>
    </Tooltip>
  );
}
