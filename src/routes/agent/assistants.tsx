import { createFileRoute } from "@tanstack/react-router";
import { AssistantsPage } from "@/pages/Assistants/AssistantsPage";

export const Route = createFileRoute("/agent/assistants")({
  head: () => ({
    meta: [{ title: "Assistentes · Agent Platform" }],
  }),
  component: AssistantsPage,
});
