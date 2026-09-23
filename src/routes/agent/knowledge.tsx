import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeBasePage } from "@/pages/KnowledgeBase/KnowledgeBasePage";

export const Route = createFileRoute("/agent/knowledge")({
  head: () => ({
    meta: [{ title: "Base de conhecimento · Agent Platform" }],
  }),
  component: KnowledgeBasePage,
});
