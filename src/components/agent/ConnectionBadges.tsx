import type { AgentPlatformStatus } from "@/types/agent";
import { cn } from "@/lib/utils";

interface Props {
  status: AgentPlatformStatus | null;
}

function Badge({ label, ok }: { label: string; ok: boolean | null }) {
  return (
    <span
      className={cn(
        "hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline",
        ok === null && "bg-muted text-muted-foreground",
        ok === true && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        ok === false && "bg-destructive/15 text-destructive",
      )}
    >
      {label}
    </span>
  );
}

export function ConnectionBadges({ status }: Props) {
  if (!status) {
    return <Badge label="API offline" ok={false} />;
  }

  return (
    <>
      <Badge label="API" ok={status.apiStatus === "UP"} />
      <Badge label="LLM" ok={status.llm.reachable} />
      <Badge label="Modelo" ok={status.llm.modelReady} />
      <Badge
        label={status.ready ? "Pronto" : "Pendente"}
        ok={status.ready ? true : false}
      />
    </>
  );
}
