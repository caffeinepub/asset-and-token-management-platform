import AccountPanel from "@/components/AccountPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { usePlatformConfig } from "@/hooks/useQueries";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { FolderKanban, LogIn, LogOut, ScrollText, User } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const currentPath = routerState.location.pathname;
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const { platformName, accentColor } = usePlatformConfig();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
            >
              <FolderKanban className="h-6 w-6 text-primary" />
              {isAuthenticated && (
                <span
                  className="hidden sm:inline"
                  style={{ color: accentColor }}
                >
                  {platformName}
                </span>
              )}
              {!isAuthenticated && (
                <span className="hidden sm:inline">Asset Manager</span>
              )}
            </button>
            <nav className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate({ to: "/" })}
                data-ocid="nav.projects.link"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentPath === "/"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5" />
                Projects
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/audit-log" })}
                data-ocid="nav.audit_log.link"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentPath === "/audit-log"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <ScrollText className="h-3.5 w-3.5" />
                Audit Log
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-ocid="header.account.button"
                  onClick={() => setAccountPanelOpen(true)}
                  className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors rounded-md px-2 py-1 hover:bg-accent/50"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">
                    {identity.getPrincipal().toString().slice(0, 8)}...
                  </span>
                </button>
                <Button onClick={clear} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button onClick={login} disabled={isLoggingIn} size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                {isLoggingIn ? "Connecting..." : "Login"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {isAuthenticated && (
        <AccountPanel
          open={accountPanelOpen}
          onOpenChange={setAccountPanelOpen}
        />
      )}
    </>
  );
}
