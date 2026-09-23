import type { ReactNode } from "react";
import { StickToBottom } from "use-stick-to-bottom";

interface Props {
  children: ReactNode;
}

/**
 * Área de mensagens com scroll automático (use-stick-to-bottom).
 */
export function ChatScrollArea({ children }: Props) {
  return (
    <StickToBottom
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </StickToBottom.Content>
    </StickToBottom>
  );
}
