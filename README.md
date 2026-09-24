# agent-front

Interface web (Vite + React) para a **Agent API**: chat, cadastro de assistentes, base de conhecimento e teste de ferramentas.

## Desenvolvimento

```bash
cp .env.exemple .env
npm install
npm run dev
```

Configure `VITE_AGENT_API_URL` (ex.: `http://localhost:8080`).

## Rotas

| Rota | Função |
|------|--------|
| `/agent/playground` | Chat |
| `/agent/assistants` | CRUD de assistentes |
| `/agent/knowledge` | RAG ingestão/busca |
| `/agent/dev-tools` | Invocar tools da API |
