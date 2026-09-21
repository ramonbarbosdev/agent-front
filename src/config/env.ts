/**
 * Central place for environment configuration.
 * Components and services must never hardcode the API URL.
 */
export const env = {
  agentApiUrl:
    (import.meta.env["VITE_AGENT_API_URL"] as string | undefined)?.replace(/\/$/, "") ??
    "http://localhost:8081",
  requestTimeoutMs: 60_000,
};
