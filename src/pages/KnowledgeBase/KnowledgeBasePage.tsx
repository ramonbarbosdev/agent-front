import { useCallback, useEffect, useState } from "react";
import { FileText, Lightbulb, List, Search } from "lucide-react";
import { AgentAppLayout } from "@/components/agent/AgentAppLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteRagDocument,
  fetchRagDocument,
  fetchRagDocuments,
  ingestRagDocument,
  searchRag,
  updateRagDocument,
} from "@/services/agentApi";
import type { RagDocumentSummary, RagSearchHit } from "@/types/agent";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const DOCUMENT_TEMPLATE = `TÍTULO DO DOCUMENTO — VIGÊNCIA / ANO

Resumo: uma ou duas frases com o objetivo deste material.

## Escopo
O que este documento cobre e o que não cobre.

## Regras principais
- Regra 1 (seja específico: prazos, valores, elegibilidade).
- Regra 2.
- Regra 3.

## Prazos e exceções
| Situação | Prazo ou ação |
|----------|----------------|
| Exemplo A | 5 dias úteis |
| Exemplo B | Aprovação do gestor |

## Ferramentas e canais
- Sistema oficial: (ex.: portal RH, Jira).
- Dúvidas: e-mail ou canal interno.

## Glossário (opcional)
Termo interno — definição curta.
`;

function formatScore(score: number): string {
  return score.toFixed(3);
}

function formatIndexedAt(iso: string): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function KnowledgeBasePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [fonte, setFonte] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [ingesting, setIngesting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<RagSearchHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [documents, setDocuments] = useState<RagDocumentSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editFonte, setEditFonte] = useState("");
  const [editConteudo, setEditConteudo] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<RagDocumentSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const charCount = conteudo.length;
  const editCharCount = editConteudo.length;

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      setDocuments(await fetchRagDocuments());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao listar documentos");
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

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
      await loadDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na ingestão");
    } finally {
      setIngesting(false);
    }
  }, [titulo, fonte, conteudo, loadDocuments]);

  const openEdit = useCallback(async (doc: RagDocumentSummary) => {
    setEditId(doc.documentoId);
    setEditOpen(true);
    setEditLoading(true);
    setEditTitulo(doc.titulo);
    setEditFonte(doc.fonte);
    setEditConteudo("");
    try {
      const detail = await fetchRagDocument(doc.documentoId);
      setEditTitulo(detail.titulo);
      setEditFonte(detail.fonte);
      setEditConteudo(detail.conteudo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar documento");
      setEditOpen(false);
      setEditId(null);
    } finally {
      setEditLoading(false);
    }
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editId || !editTitulo.trim() || !editFonte.trim() || !editConteudo.trim()) {
      toast.error("Preencha título, fonte e conteúdo.");
      return;
    }
    setEditSaving(true);
    try {
      await updateRagDocument(editId, {
        titulo: editTitulo.trim(),
        fonte: editFonte.trim(),
        conteudo: editConteudo.trim(),
      });
      toast.success("Documento atualizado e reindexado");
      setEditOpen(false);
      setEditId(null);
      await loadDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setEditSaving(false);
    }
  }, [editId, editTitulo, editFonte, editConteudo, loadDocuments]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRagDocument(deleteTarget.documentoId);
      toast.success("Documento removido da base");
      setDeleteTarget(null);
      await loadDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, loadDocuments]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setHasSearched(true);
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

  const applyTemplate = () => {
    if (conteudo.trim() && !window.confirm("Substituir o conteúdo atual pelo modelo?")) {
      return;
    }
    setConteudo(DOCUMENT_TEMPLATE);
    if (!titulo.trim()) {
      setTitulo("Manual interno");
    }
    if (!fonte.trim()) {
      setFonte("Área responsável / ano");
    }
  };

  const clearIngestForm = () => {
    setTitulo("");
    setFonte("");
    setConteudo("");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <AgentAppLayout
        activeNav="knowledge"
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        sidebarBody={
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Dica de indexação</p>
            <p>
              Títulos claros, seções com ## e listas curtas melhoram a busca FTS. Um documento por
              política ou manual.
            </p>
          </div>
        }
        header={
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Base de conhecimento</h1>
            <p className="text-xs text-muted-foreground">
              Indexe manuais e políticas para o RAG no chat e na ferramenta de busca.
            </p>
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <Tabs defaultValue="index" className="w-full">
              <TabsList className="grid w-full max-w-xl grid-cols-3">
                <TabsTrigger value="index" className="gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Indexar
                </TabsTrigger>
                <TabsTrigger value="listed" className="gap-2">
                  <List className="h-3.5 w-3.5" />
                  Indexados
                </TabsTrigger>
                <TabsTrigger value="search" className="gap-2">
                  <Search className="h-3.5 w-3.5" />
                  Testar busca
                </TabsTrigger>
              </TabsList>

              <TabsContent value="index" className="mt-4 space-y-4">
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Como estruturar o texto</AlertTitle>
                  <AlertDescription className="text-muted-foreground">
                    Use cabeçalhos (##), listas e tabelas simples. Evite PDF colado sem quebras de
                    linha. O sistema divide o texto em trechos — parágrafos curtos e palavras-chave
                    repetidas no contexto certo ajudam o assistente a recuperar a resposta.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">Novo documento</CardTitle>
                        <CardDescription>
                          Metadados aparecem nos resultados da busca; o corpo é chunkado no
                          PostgreSQL (FTS).
                        </CardDescription>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={applyTemplate}>
                        Usar modelo
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="rag-titulo">Título</Label>
                        <Input
                          id="rag-titulo"
                          value={titulo}
                          onChange={(e) => setTitulo(e.target.value)}
                          placeholder="Política de horas extras 2026"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="rag-fonte">Fonte</Label>
                        <Input
                          id="rag-fonte"
                          value={fonte}
                          onChange={(e) => setFonte(e.target.value)}
                          placeholder="RH · CLT interna"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="rag-conteudo">Conteúdo</Label>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {charCount.toLocaleString("pt-BR")} caracteres
                        </span>
                      </div>
                      <Textarea
                        id="rag-conteudo"
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                        rows={16}
                        className="min-h-[min(420px,50vh)] font-mono text-[13px] leading-relaxed"
                        placeholder="Cole ou escreva o documento com seções claras…"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => void handleIngest()} disabled={ingesting}>
                        {ingesting ? "Indexando…" : "Indexar documento"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={clearIngestForm}
                        disabled={ingesting}
                      >
                        Limpar formulário
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="listed" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">Documentos na base</CardTitle>
                        <CardDescription>
                          Tudo que já foi indexado e está disponível para busca e RAG.
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void loadDocuments()}
                        disabled={loadingDocs}
                      >
                        {loadingDocs ? "Atualizando…" : "Atualizar"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingDocs && documents.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
                    )}
                    {!loadingDocs && documents.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum documento indexado. Use a aba Indexar para adicionar o primeiro.
                      </p>
                    )}
                    {documents.length > 0 && (
                      <div className="rounded-lg border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Título</TableHead>
                              <TableHead className="hidden sm:table-cell">Fonte</TableHead>
                              <TableHead className="text-right">Trechos</TableHead>
                              <TableHead className="hidden md:table-cell">Indexado em</TableHead>
                              <TableHead className="w-[8.5rem] text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {documents.map((doc) => (
                              <TableRow key={doc.documentoId}>
                                <TableCell className="max-w-[14rem] font-medium sm:max-w-none">
                                  <span className="line-clamp-2">{doc.titulo}</span>
                                  <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground sm:hidden">
                                    {doc.fonte}
                                  </span>
                                </TableCell>
                                <TableCell className="hidden text-muted-foreground sm:table-cell">
                                  {doc.fonte}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {doc.chunkCount}
                                </TableCell>
                                <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                                  {formatIndexedAt(doc.criadoEm)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => void openEdit(doc)}
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => setDeleteTarget(doc)}
                                    >
                                      Excluir
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      {documents.length} documento{documents.length !== 1 ? "s" : ""} na base
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Buscar trechos</CardTitle>
                    <CardDescription>
                      Mesma busca usada no chat (injeção RAG) e na tool search_knowledge_base.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ex.: aprovação horas extras, prazo plano de saúde"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleSearch();
                        }}
                      />
                      <Button
                        type="button"
                        className="shrink-0 sm:min-w-[7rem]"
                        onClick={() => void handleSearch()}
                        disabled={searching || !searchQuery.trim()}
                      >
                        {searching ? "Buscando…" : "Buscar"}
                      </Button>
                    </div>

                    <Separator />

                    {!hasSearched && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Digite termos como um colaborador faria e confira os trechos recuperados.
                      </p>
                    )}

                    {hasSearched && hits.length === 0 && !searching && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum trecho para esta consulta. Tente sinônimos ou indexe mais conteúdo.
                      </p>
                    )}

                    {hits.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {hits.length} trecho{hits.length !== 1 ? "s" : ""} · ordenados por
                          relevância
                        </p>
                        <ScrollArea className="h-[min(520px,calc(100vh-16rem))] pr-3">
                          <ul className="space-y-3">
                            {hits.map((hit, i) => (
                              <li
                                key={`${hit.titulo}-${hit.fonte}-${i}`}
                                className="rounded-lg border border-border bg-card p-4 shadow-sm"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium leading-tight">
                                    {hit.titulo}
                                  </span>
                                  <Badge variant="secondary" className="font-normal">
                                    {hit.fonte}
                                  </Badge>
                                  <Badge variant="outline" className="font-mono font-normal">
                                    score {formatScore(hit.score)}
                                  </Badge>
                                </div>
                                <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/50 px-3 py-2.5 text-sm leading-relaxed text-foreground/90">
                                  {hit.conteudo}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Dialog open={editOpen} onOpenChange={(open) => !editSaving && setEditOpen(open)}>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar documento</DialogTitle>
                  <DialogDescription>
                    Alterações no texto reindexam os trechos usados na busca e no RAG.
                  </DialogDescription>
                </DialogHeader>
                {editLoading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-titulo">Título</Label>
                        <Input
                          id="edit-titulo"
                          value={editTitulo}
                          onChange={(e) => setEditTitulo(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-fonte">Fonte</Label>
                        <Input
                          id="edit-fonte"
                          value={editFonte}
                          onChange={(e) => setEditFonte(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="edit-conteudo">Conteúdo</Label>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {editCharCount.toLocaleString("pt-BR")} caracteres
                        </span>
                      </div>
                      <Textarea
                        id="edit-conteudo"
                        value={editConteudo}
                        onChange={(e) => setEditConteudo(e.target.value)}
                        rows={14}
                        className="min-h-[240px] font-mono text-[13px] leading-relaxed"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditOpen(false)}
                    disabled={editSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSaveEdit()}
                    disabled={editSaving || editLoading}
                  >
                    {editSaving ? "Salvando…" : "Salvar e reindexar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog
              open={deleteTarget !== null}
              onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O documento <strong>{deleteTarget?.titulo}</strong> e todos os trechos indexados
                    serão removidos. O assistente deixa de encontrar esse conteúdo na busca.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                  >
                    {deleting ? "Excluindo…" : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </AgentAppLayout>
    </TooltipProvider>
  );
}
