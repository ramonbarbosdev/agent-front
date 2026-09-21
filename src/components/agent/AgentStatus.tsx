interface Props {
  loading: boolean;
  error: string | null;
  onRetryDismiss?: () => void;
}

export function AgentStatus({ loading, error, onRetryDismiss }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
        </span>
        Assistente está pensando… A primeira resposta do modelo pode levar alguns minutos.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <span>{error}</span>
        {onRetryDismiss && (
          <button
            type="button"
            onClick={onRetryDismiss}
            className="shrink-0 text-xs font-medium underline underline-offset-2"
          >
            Fechar
          </button>
        )}
      </div>
    );
  }

  return null;
}
