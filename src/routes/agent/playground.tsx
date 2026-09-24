import { createFileRoute } from "@tanstack/react-router";
import { AgentPlayground } from "@/pages/AgentPlayground/AgentPlayground";

export const Route = createFileRoute("/agent/playground")({
  head: () => ({
    meta: [
      { title: "Chat · Console de agentes" },
      {
        name: "description",
        content: "Converse com os assistentes configurados na Agent API.",
      },
      { property: "og:title", content: "Chat · Console de agentes" },
      {
        property: "og:description",
        content: "Interface de chat corporativo para assistentes da plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentPlayground,
});
