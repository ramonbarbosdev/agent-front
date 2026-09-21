import type { ChatMessage as ChatMessageType } from "@/types/agent";
import { cn } from "@/lib/utils";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] sm:max-w-[72%]")}>
        <p
          className={cn(
            "mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
            isUser && "text-right",
          )}
        >
          {isUser ? "Você" : "Assistente 🤖"}
        </p>
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-xl border px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-card text-card-foreground",
          )}
        >
          {message.content}
        </div>
        <p className={cn("mt-1 text-[11px] text-muted-foreground", isUser && "text-right")}>
          {message.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
