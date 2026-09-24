import { Copy, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { ChatMessage as ChatMessageType } from "@/types/agent";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AssistantIcon } from "@/lib/assistant-icons";
import { ChatMarkdown } from "./ChatMarkdown";
import { cn } from "@/lib/utils";

interface Props {
  message: ChatMessageType;
  assistantLabel: string;
  assistantCode: string;
}

export function ChatMessage({ message, assistantLabel, assistantCode }: Props) {
  const isUser = message.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Mensagem copiada");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const timeLabel = format(message.createdAt, "HH:mm", { locale: ptBR });

  return (
    <div className={cn("group flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar className={cn("h-9 w-9 border border-border", isUser && "bg-primary/10")}>
        <AvatarFallback
          className={cn(
            "text-sm",
            isUser ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <AssistantIcon code={assistantCode} />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[min(85%,42rem)] flex-col gap-1", isUser && "items-end")}>
        <div className={cn("flex items-center gap-2", isUser && "flex-row-reverse")}>
          <span className="text-xs font-medium text-foreground">
            {isUser ? "Você" : assistantLabel}
          </span>
          <span className="text-[11px] text-muted-foreground">{timeLabel}</span>
        </div>

        <div
          className={cn(
            "relative break-words rounded-2xl px-4 py-2.5 shadow-sm",
            isUser
              ? "rounded-tr-md bg-primary text-primary-foreground"
              : "rounded-tl-md border border-border bg-card text-card-foreground",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          ) : (
            <ChatMarkdown content={message.content} />
          )}
        </div>

        {!isUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => void copy()}
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar resposta</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
