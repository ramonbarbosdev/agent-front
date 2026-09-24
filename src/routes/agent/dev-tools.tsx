import { createFileRoute } from "@tanstack/react-router";
import { DevToolsPage } from "@/pages/DevTools/DevToolsPage";

export const Route = createFileRoute("/agent/dev-tools")({
  head: () => ({
    meta: [{ title: "Ferramentas (dev) · Console de agentes" }],
  }),
  component: DevToolsPage,
});
