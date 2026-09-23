import { Link } from "@tanstack/react-router";
import { BookOpen, MessageSquare, Wrench, X, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AgentNavId = "playground" | "knowledge" | "devtools";

const NAV: { id: AgentNavId; to: string; label: string; icon: typeof MessageSquare }[] = [
  { id: "playground", to: "/agent/playground", label: "Playground", icon: MessageSquare },
  { id: "knowledge", to: "/agent/knowledge", label: "Base de conhecimento", icon: BookOpen },
  { id: "devtools", to: "/agent/dev-tools", label: "Ferramentas (dev)", icon: Wrench },
];

interface AgentAppLayoutProps {
  activeNav: AgentNavId;
  sidebarFooter?: ReactNode;
  sidebarBody?: ReactNode;
  header: ReactNode;
  children: ReactNode;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
}

export function AgentAppLayout({
  activeNav,
  sidebarFooter,
  sidebarBody,
  header,
  children,
  sidebarOpen,
  onSidebarOpenChange,
}: AgentAppLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 md:hidden"
          onClick={() => onSidebarOpenChange(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border bg-sidebar p-4 transition-transform md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Agent Platform</span>
          <button
            type="button"
            className="md:hidden"
            aria-label="Fechar menu"
            onClick={() => onSidebarOpenChange(false)}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <nav className="mb-4 flex flex-col gap-0.5" aria-label="Navegação">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeNav;
            return (
              <Link
                key={item.id}
                to={item.to}
                onClick={() => onSidebarOpenChange(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {sidebarBody}

        {sidebarFooter}

        <p className="mt-auto pt-4 text-[11px] text-muted-foreground">Agent Playground · MVP</p>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
          <button
            type="button"
            className="md:hidden"
            aria-label="Abrir menu"
            onClick={() => onSidebarOpenChange(true)}
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          {header}
        </header>
        {children}
      </main>
    </div>
  );
}
