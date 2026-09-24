import { useCallback, useEffect, useState } from "react";
import { AgentAppLayout } from "@/components/agent/AgentAppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createAssistant,
  deleteAssistant,
  fetchAssistant,
  fetchAssistants,
  fetchToolCatalog,
  updateAssistant,
} from "@/services/agentApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AssistantConfig, ToolCatalogEntry } from "@/types/agent";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AssistantsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [list, setList] = useState<AssistantConfig[]>([]);
  const [catalog, setCatalog] = useState<ToolCatalogEntry[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [prependBase, setPrependBase] = useState(true);
  const [model, setModel] = useState("");
  const [active, setActive] = useState(true);
  const [ragInject, setRagInject] = useState(true);
  const [ragTopK, setRagTopK] = useState(4);
  const [tools, setTools] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [assistants, toolsCatalog] = await Promise.all([
        fetchAssistants(true).then(async (items) => {
          const full = await Promise.all(items.map((i) => fetchAssistant(i.code)));
          return full;
        }),
        fetchToolCatalog(),
      ]);
      setList(assistants);
      setCatalog(toolsCatalog);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar assistentes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetFormNew = () => {
    setSelectedCode(null);
    setCode("");
    setName("");
    setDescription("");
    setSystemPrompt("");
    setPrependBase(true);
    setModel("");
    setActive(true);
    setRagInject(true);
    setRagTopK(4);
    setTools([]);
  };

  const loadIntoForm = (assistant: AssistantConfig) => {
    setSelectedCode(assistant.code);
    setCode(assistant.code);
    setName(assistant.name);
    setDescription(assistant.description ?? "");
    setSystemPrompt(assistant.systemPrompt);
    setPrependBase(false);
    setModel(assistant.model ?? "");
    setActive(assistant.active);
    setRagInject(assistant.ragInject);
    setRagTopK(assistant.ragTopK);
    setTools(assistant.tools ?? []);
  };

  const toggleTool = (toolName: string, checked: boolean) => {
    setTools((prev) =>
      checked ? [...new Set([...prev, toolName])] : prev.filter((t) => t !== toolName),
    );
  };

  const handleDelete = async () => {
    if (!selectedCode) return;
    setDeleting(true);
    try {
      await deleteAssistant(selectedCode);
      toast.success(`Assistente ${selectedCode} excluído`);
      resetFormNew();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      toast.error("Nome e prompt são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        code: selectedCode ? undefined : code.trim(),
        name: name.trim(),
        description: description.trim(),
        systemPrompt: systemPrompt.trim(),
        prependBasePrompt: prependBase,
        model: model.trim() || undefined,
        active,
        ragInject,
        ragTopK,
        tools,
      };
      if (selectedCode) {
        await updateAssistant(selectedCode, body);
        toast.success("Assistente atualizado");
      } else {
        if (!code.trim()) {
          toast.error("Informe o código (ex.: MEU_ASSISTENTE)");
          setSaving(false);
          return;
        }
        await createAssistant({ ...body, code: code.trim() });
        toast.success("Assistente criado");
      }
      await load();
      resetFormNew();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <AgentAppLayout
        activeNav="assistants"
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        header={
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Assistentes</h1>
            <p className="text-xs text-muted-foreground">
              Crie e edite assistentes (prompt, modelo, tools, RAG) sem alterar código.
            </p>
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[240px_1fr]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cadastrados</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={resetFormNew}>
                  Novo
                </Button>
              </CardHeader>
              <CardContent className="space-y-1">
                {loading && <p className="text-xs text-muted-foreground">Carregando…</p>}
                {list.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => loadIntoForm(item)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      selectedCode === item.code ? "border-primary bg-accent" : "border-border"
                    }`}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {item.code}
                      {!item.active ? " · inativo" : ""}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedCode ? `Editar ${selectedCode}` : "Novo assistente"}
                </CardTitle>
                <CardDescription>
                  O código é usado no chat (`assistant` no JSON). Tools vêm do catálogo Java.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedCode && (
                  <div className="space-y-1.5">
                    <Label htmlFor="asst-code">Código</Label>
                    <Input
                      id="asst-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="MEU_ASSISTENTE"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="asst-name">Nome</Label>
                  <Input id="asst-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="asst-desc">Descrição</Label>
                  <Input
                    id="asst-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="asst-prompt">Prompt de sistema</Label>
                  <Textarea
                    id="asst-prompt"
                    rows={8}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                  />
                </div>
                {!selectedCode && (
                  <div className="flex items-center gap-2">
                    <Switch checked={prependBase} onCheckedChange={setPrependBase} />
                    <Label>Prefixar com prompt base da plataforma</Label>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="asst-model">Modelo Ollama (opcional)</Label>
                    <Input
                      id="asst-model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="qwen3:8b"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="asst-topk">RAG top-K</Label>
                    <Input
                      id="asst-topk"
                      type="number"
                      min={1}
                      value={ragTopK}
                      onChange={(e) => setRagTopK(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={active} onCheckedChange={setActive} />
                    <Label>Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={ragInject} onCheckedChange={setRagInject} />
                    <Label>Injetar RAG no prompt</Label>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Tools</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {catalog.map((tool) => (
                      <label
                        key={tool.name}
                        className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2 text-sm"
                      >
                        <Checkbox
                          checked={tools.includes(tool.name)}
                          onCheckedChange={(c) => toggleTool(tool.name, c === true)}
                        />
                        <span>
                          <span className="font-mono text-xs">{tool.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {tool.kind} — {tool.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void handleSave()} disabled={saving}>
                    {saving ? "Salvando…" : selectedCode ? "Salvar alterações" : "Criar assistente"}
                  </Button>
                  {selectedCode && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={deleting || saving}>
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir assistente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O código <strong>{selectedCode}</strong> deixa de existir no playground.
                            Conversas antigas permanecem no banco, mas não será possível iniciar novos
                            chats com este assistente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => void handleDelete()}
                          >
                            {deleting ? "Excluindo…" : "Excluir definitivamente"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AgentAppLayout>
    </TooltipProvider>
  );
}
