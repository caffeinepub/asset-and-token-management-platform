import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardList, FolderKanban, LogIn, LogOut, User } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            <FolderKanban className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">Asset Manager</span>
          </button>

          {isAuthenticated && (
            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate({ to: "/audit-log" })}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Audit Log</span>
              </button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="max-w-[120px] truncate">
                  {identity.getPrincipal().toString().slice(0, 8)}...
                </span>
              </div>
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
  );
}
