import { Button } from "@/components/ui/button";
import { useSelfAssignAdmin } from "@/hooks/useQueries";
import { Loader2, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";

export default function DevToolsPanel() {
  const selfAssignAdmin = useSelfAssignAdmin();

  const handleAssign = async () => {
    try {
      await selfAssignAdmin.mutateAsync();
      toast.success("Admin role assigned to your principal");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to assign admin role";
      toast.error(message);
    }
  };

  return (
    <div
      data-ocid="devtools.panel"
      className="border-2 border-amber-500 rounded-lg p-5 bg-amber-50 dark:bg-amber-950/20"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
          <Wrench className="h-3 w-3" />
          DEV TOOLS
        </span>
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Self-Assign Global Admin Role
        </h3>
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
        Developer utility — promotes your principal to global admin
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          data-ocid="devtools.assign.primary_button"
          onClick={handleAssign}
          disabled={selfAssignAdmin.isPending}
          className="bg-amber-500 hover:bg-amber-600 text-white border-0 shrink-0"
        >
          {selfAssignAdmin.isPending ? (
            <>
              <span data-ocid="devtools.assign.loading_state">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              </span>
              Assigning…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Assign Admin to Me
            </>
          )}
        </Button>

        {selfAssignAdmin.isSuccess && (
          <span
            data-ocid="devtools.assign.success_state"
            className="text-xs text-amber-700 dark:text-amber-300 font-medium"
          >
            ✓ Admin assigned
          </span>
        )}
      </div>
    </div>
  );
}
