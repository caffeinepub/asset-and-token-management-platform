import { Button } from "@/components/ui/button";
import { useSelfAssignAdmin } from "@/hooks/useQueries";
import { Loader2, ShieldAlert } from "lucide-react";

export default function DevToolsPanel() {
  const selfAssignAdmin = useSelfAssignAdmin();

  return (
    <div
      data-ocid="dev_tools.panel"
      className="mt-10 rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-500/10 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-amber-500/20 border-b-2 border-amber-500">
        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold tracking-widest text-amber-700 dark:text-amber-400 uppercase">
            Dev Tools
          </span>
          <span className="hidden sm:inline text-xs font-medium text-amber-600/80 dark:text-amber-500/80 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/40">
            DEV ONLY — Not for production use
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
          Assign the global <span className="font-semibold">admin</span> role to
          your currently authenticated principal, bypassing role guards. Use
          only in development environments.
        </p>
        <Button
          data-ocid="dev_tools.assign_admin.button"
          variant="outline"
          size="sm"
          className="shrink-0 border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-500/20 dark:hover:text-amber-300 disabled:opacity-60"
          onClick={() => selfAssignAdmin.mutate()}
          disabled={selfAssignAdmin.isPending}
        >
          {selfAssignAdmin.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning…
            </>
          ) : (
            <>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Assign Admin to Me
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
