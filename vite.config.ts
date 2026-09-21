
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Não use `plugins: [react()]` aqui — @lovable.dev/vite-tanstack-config já registra
 * @vitejs/plugin-react. Duplicar causa: RefreshRuntime has already been declared.
 */
export default defineConfig({
  vite: {
    server: {
      port: 5173,
      strictPort: true,
    },
  },
});
