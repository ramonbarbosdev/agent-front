import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssistantIcon } from "@/lib/assistant-icons";

interface Props {
  assistantLabel: string;
  assistantCode: string;
}

export function ChatTypingIndicator({ assistantLabel, assistantCode }: Props) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 border border-border">
        <AvatarFallback className="bg-muted text-muted-foreground">
          <AssistantIcon code={assistantCode} />
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{assistantLabel}</p>
        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3">
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Gerando resposta… pode levar um pouco na primeira mensagem.
        </p>
      </div>
    </div>
  );
}
