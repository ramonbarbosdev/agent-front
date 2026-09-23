import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "Como o assistente de horas extras pode me ajudar?",
  "Quais informações preciso para consultar horas extras?",
  "Explique o processo de horas extras em passos simples.",
];

interface Props {
  disabled: boolean;
  onPick: (text: string) => void;
}

export function ChatEmptyState({ disabled, onPick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
        <MessageCircle className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">Bate-papo com o assistente</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Envie uma mensagem ou escolha uma sugestão abaixo. O histórico desta conversa é enviado à
        API para manter o contexto.
      </p>
      <div className="mt-8 flex w-full max-w-lg flex-col gap-2">
        {SUGGESTIONS.map((text) => (
          <Button
            key={text}
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-auto min-h-10 whitespace-normal px-4 py-2.5 text-left text-sm font-normal"
            onClick={() => onPick(text)}
          >
            {text}
          </Button>
        ))}
      </div>
    </div>
  );
}
