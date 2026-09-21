import { createFileRoute } from "@tanstack/react-router";
import { AgentPlayground } from "@/pages/AgentPlayground/AgentPlayground";

export const Route = createFileRoute("/agent/playground")({
  head: () => ({
    meta: [
      { title: "Agent Playground · Agent Platform" },
      {
        name: "description",
        content:
          "Converse com os assistentes de IA da Agent Platform diretamente pelo playground.",
      },
      { property: "og:title", content: "Agent Playground · Agent Platform" },
      {
        property: "og:description",
        content: "Teste os assistentes de IA da Agent Platform em um chat limpo e rápido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentPlayground,
});
