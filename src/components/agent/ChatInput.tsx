import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { env } from "@/config/env";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  disabled: boolean;
  onSend: (message: string) => void;
}

export function ChatInput({ disabled, onSend }: Props) {
  const [value, setValue] = useState("");
  const length = value.length;
  const canSend = value.trim().length > 0 && !disabled && length <= env.maxMessageLength;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <div
        className={cn(
          "mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm transition-colors",
          "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30",
          disabled && "opacity-60",
        )}
      >
        <TextareaAutosize
          minRows={1}
          maxRows={6}
          value={value}
          disabled={disabled}
          maxLength={env.maxMessageLength}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Aguardando conexão com a API…" : "Escreva sua mensagem…"}
          className="max-h-40 min-h-[44px] w-full flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Button
          type="button"
          size="icon"
          onClick={submit}
          disabled={!canSend}
          className="h-11 w-11 shrink-0 rounded-xl"
          aria-label="Enviar mensagem"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mx-auto mt-2 flex w-full max-w-3xl justify-between gap-2 px-1 text-[11px] text-muted-foreground">
        <span>Enter envia · Shift + Enter nova linha</span>
        <span className={length > env.maxMessageLength * 0.9 ? "text-destructive" : undefined}>
          {length}/{env.maxMessageLength}
        </span>
      </p>
    </div>
  );
}
