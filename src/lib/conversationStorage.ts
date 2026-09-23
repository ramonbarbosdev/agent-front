import type { AssistantType } from "@/types/agent";

const PREFIX = "agent-front.conversation";

export function getStoredConversationId(assistant: AssistantType): string | undefined {
  try {
    const value = sessionStorage.getItem(`${PREFIX}:${assistant}`);
    return value && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

export function setStoredConversationId(
  assistant: AssistantType,
  conversationId: string | undefined,
): void {
  try {
    const key = `${PREFIX}:${assistant}`;
    if (!conversationId) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, conversationId);
    }
  } catch {
    // ignore quota / private mode
  }
}
