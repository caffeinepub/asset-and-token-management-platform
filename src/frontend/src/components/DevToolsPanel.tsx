import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActor } from "@/hooks/useActor";
import { useAssets, useProjects, useSelfAssignAdmin } from "@/hooks/useQueries";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DevToolsPanel() {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  const { actor } = useActor();
  const { data: projects } = useProjects();
  const { data: assets } = useAssets();

  const { data: allTasks } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: async () => {
      if (!actor || !projects) return [];
      const results = await Promise.all(
        projects.map((p) => actor.listTasksByProject(p.id)),
      );
      return results.flat();
    },
    enabled: !!actor && !!projects && projects.length > 0,
  });

  const { data: allCollections } = useQuery({
    queryKey: ["collections", "all"],
    queryFn: async () => {
      if (!actor || !projects) return [];
      const results = await Promise.all(
        projects.map((p) => actor.listCollectionsByProject(p.id)),
      );
      return results.flat();
    },
    enabled: !!actor && !!projects && projects.length > 0,
  });

  const selfAssignAdmin = useSelfAssignAdmin();

  const handleAssign = async () => {
    if (!selectedEntityId) return;
    const entityId = BigInt(selectedEntityId);
    try {
      await selfAssignAdmin.mutateAsync(entityId);
      toast.success(`Admin role assigned for entity #${selectedEntityId}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to assign admin role");
    }
  };

  const hasEntities =
    (projects && projects.length > 0) ||
    (assets && assets.length > 0) ||
    (allTasks && allTasks.length > 0) ||
    (allCollections && allCollections.length > 0);

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
          Self-Assign Admin Role
        </h3>
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
        Developer utility — assign admin to your principal on any entity
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <Select
            value={selectedEntityId}
            onValueChange={setSelectedEntityId}
            disabled={selfAssignAdmin.isPending}
          >
            <SelectTrigger
              data-ocid="devtools.entity.select"
              className="bg-white dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 focus:ring-amber-500"
            >
              <SelectValue placeholder="Select an entity..." />
            </SelectTrigger>
            <SelectContent>
              {!hasEntities && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No entities found. Create projects, assets, tasks, or
                  collections first.
                </div>
              )}

              {projects && projects.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Projects</SelectLabel>
                  {projects.map((project) => (
                    <SelectItem
                      key={`project-${project.id}`}
                      value={project.id.toString()}
                    >
                      #{project.id.toString()} — {project.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {assets && assets.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Assets</SelectLabel>
                  {assets.map((asset) => (
                    <SelectItem
                      key={`asset-${asset.id}`}
                      value={asset.id.toString()}
                    >
                      #{asset.id.toString()} — {asset.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {allTasks && allTasks.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Tasks</SelectLabel>
                  {allTasks.map((task) => (
                    <SelectItem
                      key={`task-${task.id}`}
                      value={task.id.toString()}
                    >
                      #{task.id.toString()} — {task.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {allCollections && allCollections.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Collections</SelectLabel>
                  {allCollections.map((collection) => (
                    <SelectItem
                      key={`collection-${collection.id}`}
                      value={collection.id.toString()}
                    >
                      #{collection.id.toString()} — {collection.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          data-ocid="devtools.assign.primary_button"
          onClick={handleAssign}
          disabled={!selectedEntityId || selfAssignAdmin.isPending}
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
