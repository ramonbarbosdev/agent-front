/**
 * Central place for environment configuration.
 * Components and services must never hardcode the API URL.
 */
function normalizeApiUrl(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return "";
  }
  let url = trimmed.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  return url;
}

const agentApiUrl = normalizeApiUrl(import.meta.env["VITE_AGENT_API_URL"] as string | undefined);

export const env = {
  agentApiUrl,
  agentApiDisplayUrl: agentApiUrl || "http://localhost:8080",
  /** Deve ser um pouco maior que OLLAMA_TIMEOUT da API (primeira inferência pode demorar). */
  requestTimeoutMs: 190_000,
  maxMessageLength: 4000,
};
