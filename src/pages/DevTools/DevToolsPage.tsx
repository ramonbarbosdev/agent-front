import { useCallback, useEffect, useState } from "react";
import { AgentAppLayout } from "@/components/agent/AgentAppLayout";
import { AssistantSelector } from "@/components/agent/AssistantSelector";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchTools, invokeTool } from "@/services/agentApi";
import type { AssistantType, ToolDescriptor } from "@/types/agent";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DevToolsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistant, setAssistant] = useState<AssistantType>("HORAS_EXTRAS");
  const [tools, setTools] = useState<ToolDescriptor[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [argumentsJson, setArgumentsJson] = useState("{}");
  const [invoking, setInvoking] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const loadTools = useCallback(async () => {
    setLoadingTools(true);
    try {
      const list = await fetchTools(assistant);
      setTools(list);
      if (list.length === 0) {
        setSelectedTool(null);
        return;
      }
      setSelectedTool((prev) => {
        const next = prev && list.some((t) => t.name === prev) ? prev : list[0].name;
        const tool = list.find((t) => t.name === next) ?? list[0];
        setArgumentsJson(defaultArgsFor(tool));
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar tools");
      setTools([]);
    } finally {
      setLoadingTools(false);
    }
  }, [assistant]);

  useEffect(() => {
    void loadTools();
  }, [loadTools]);

  const handleSelectTool = (name: string) => {
    setSelectedTool(name);
    const tool = tools.find((t) => t.name === name);
    if (tool) {
      setArgumentsJson(defaultArgsFor(tool));
    }
  };

  const handleInvoke = useCallback(async () => {
    if (!selectedTool) return;
    try {
      JSON.parse(argumentsJson);
    } catch {
      toast.error("JSON de argumentos inválido");
      return;
    }
    setInvoking(true);
    setLastResult(null);
    try {
      const res = await invokeTool({
        assistant,
        tool: selectedTool,
        arguments: argumentsJson,
      });
      setLastResult(JSON.stringify(res, null, 2));
      if (res.success) toast.success("Tool executada");
      else toast.warning("Tool retornou falha");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao invocar");
    } finally {
      setInvoking(false);
    }
  }, [assistant, selectedTool, argumentsJson]);

  return (
    <TooltipProvider delayDuration={300}>
      <AgentAppLayout
        activeNav="devtools"
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        sidebarBody={
          <AssistantSelector
            selected={assistant}
            onSelect={(value) => {
              setAssistant(value);
              setSelectedTool(null);
            }}
          />
        }
        header={
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Ferramentas (dev)</h1>
            <p className="text-xs text-muted-foreground">
              `GET /api/agent/tools` e `POST /api/agent/tools/invoke` — políticas WRITE podem ser bloqueadas.
            </p>
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Catálogo</CardTitle>
                  <CardDescription>Assistente {assistant}</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadTools()} disabled={loadingTools}>
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                {loadingTools ? (
                  <p className="text-sm text-muted-foreground">Carregando…</p>
                ) : tools.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tool disponível.</p>
                ) : (
                  <ul className="space-y-2">
                    {tools.map((tool) => (
                      <li key={tool.name}>
                        <button
                          type="button"
                          onClick={() => handleSelectTool(tool.name)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            selectedTool === tool.name
                              ? "border-primary bg-accent"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <span className="font-mono font-medium">{tool.name}</span>
                          <Badge variant={tool.kind === "WRITE" ? "destructive" : "secondary"} className="ml-2 text-[10px]">
                            {tool.kind}
                          </Badge>
                          <p className="mt-1 text-xs text-muted-foreground">{tool.description}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invocar</CardTitle>
                <CardDescription>
                  {selectedTool ? `Tool: ${selectedTool}` : "Selecione uma tool"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tool-args">Argumentos (JSON)</Label>
                  <Textarea
                    id="tool-args"
                    value={argumentsJson}
                    onChange={(e) => setArgumentsJson(e.target.value)}
                    rows={8}
                    className="font-mono text-xs"
                    disabled={!selectedTool}
                  />
                </div>
                <Button type="button" onClick={() => void handleInvoke()} disabled={!selectedTool || invoking}>
                  {invoking ? "Executando…" : "Invocar"}
                </Button>
                {lastResult && (
                  <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">{lastResult}</pre>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AgentAppLayout>
    </TooltipProvider>
  );
}

function defaultArgsFor(tool: ToolDescriptor): string {
  if (tool.name === "search_knowledge_base") {
    return JSON.stringify({ query: "política horas extras" }, null, 2);
  }
  if (tool.name === "consultar_politica_horas_extras") {
    return "{}";
  }
  if (tool.name === "obter_data_hora_servidor") {
    return "{}";
  }
  if (tool.name === "registrar_horas_extras") {
    return JSON.stringify(
      { data: "2026-03-23", horas: 2, motivo: "teste playground" },
      null,
      2,
    );
  }
  return "{}";
}
