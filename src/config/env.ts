/**
 * Central place for environment configuration.
 * Components and services must never hardcode the API URL.
 *
 * Em dev, deixe VITE_AGENT_API_URL vazio para usar o proxy do Vite (/api → :8081).
 * Em produção, defina a URL pública da Agent API.
 */
const rawApiUrl = (import.meta.env["VITE_AGENT_API_URL"] as string | undefined)?.trim();

export const env = {
  agentApiUrl: rawApiUrl ? rawApiUrl.replace(/\/$/, "") : "",
  requestTimeoutMs: 60_000,
  maxMessageLength: 4000,
};
