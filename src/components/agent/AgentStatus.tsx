interface Props {
  loading: boolean;
  error: string | null;
  onRetryDismiss?: () => void;
}

export function AgentStatus({ loading, error, onRetryDismiss }: Props) {
  if (loading) {
    return null;
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
