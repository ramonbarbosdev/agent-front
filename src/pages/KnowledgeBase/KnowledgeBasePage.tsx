import { useCallback, useState } from "react";
import { AgentAppLayout } from "@/components/agent/AgentAppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ingestRagDocument, searchRag } from "@/services/agentApi";
import type { RagSearchHit } from "@/types/agent";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function KnowledgeBasePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [fonte, setFonte] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [ingesting, setIngesting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<RagSearchHit[]>([]);

  const handleIngest = useCallback(async () => {
    if (!titulo.trim() || !fonte.trim() || !conteudo.trim()) {
      toast.error("Preencha título, fonte e conteúdo.");
      return;
    }
    setIngesting(true);
    try {
      const res = await ingestRagDocument({
        titulo: titulo.trim(),
        fonte: fonte.trim(),
        conteudo: conteudo.trim(),
      });
      toast.success(`Documento indexado (${res.documentoId})`);
      setConteudo("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na ingestão");
    } finally {
      setIngesting(false);
    }
  }, [titulo, fonte, conteudo]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const result = await searchRag(searchQuery.trim());
      setHits(result);
      if (result.length === 0) {
        toast.message("Nenhum trecho encontrado");
      }
    } catch (err) {
      setHits([]);
      toast.error(err instanceof Error ? err.message : "Falha na busca");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  return (
    <TooltipProvider delayDuration={300}>
      <AgentAppLayout
        activeNav="knowledge"
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        header={
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Base de conhecimento</h1>
            <p className="text-xs text-muted-foreground">
              Ingestão e busca RAG (`/api/agent/rag/*`) — requer `AGENT_RAG_ENABLED=true` na API.
            </p>
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ingerir documento</CardTitle>
                <CardDescription>
                  O texto é dividido em chunks e indexado no PostgreSQL (FTS).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rag-titulo">Título</Label>
                  <Input
                    id="rag-titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Política de horas extras"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rag-fonte">Fonte</Label>
                  <Input
                    id="rag-fonte"
                    value={fonte}
                    onChange={(e) => setFonte(e.target.value)}
                    placeholder="RH / CLT interna 2026"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rag-conteudo">Conteúdo</Label>
                  <Textarea
                    id="rag-conteudo"
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    rows={10}
                    placeholder="Cole o texto completo do documento..."
                  />
                </div>
                <Button type="button" onClick={() => void handleIngest()} disabled={ingesting}>
                  {ingesting ? "Enviando…" : "Indexar"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buscar trechos</CardTitle>
                <CardDescription>Mesma busca usada pelo RAG no chat e pela tool `search_knowledge_base`.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="aprovação horas extras"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSearch();
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={() => void handleSearch()} disabled={searching}>
                    {searching ? "…" : "Buscar"}
                  </Button>
                </div>
                <ul className="space-y-3">
                  {hits.map((hit, i) => (
                    <li key={`${hit.titulo}-${i}`} className="rounded-lg border border-border p-3 text-sm">
                      <p className="font-medium">
                        {hit.titulo}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          · {hit.fonte} · score {hit.score.toFixed(3)}
                        </span>
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{hit.conteudo}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </AgentAppLayout>
    </TooltipProvider>
  );
}
