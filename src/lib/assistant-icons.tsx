import {
  Bot,
  Clock,
  Headphones,
  Landmark,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

export function resolveAssistantIcon(code: string): LucideIcon {
  const normalized = code.toUpperCase();
  if (normalized.includes("HORA") || normalized.includes("EXTRA")) {
    return Clock;
  }
  if (normalized.includes("FINANC")) {
    return Landmark;
  }
  if (normalized.includes("SUPORTE")) {
    return Headphones;
  }
  if (normalized.includes("RH") || normalized.includes("PESSO")) {
    return Users;
  }
  if (normalized.includes("CHAT") || normalized.includes("FAQ")) {
    return MessageSquare;
  }
  return Bot;
}

interface AssistantIconProps {
  code: string;
  className?: string;
}

export function AssistantIcon({ code, className = "h-4 w-4" }: AssistantIconProps) {
  const Icon = resolveAssistantIcon(code);
  return <Icon className={className} aria-hidden />;
}
