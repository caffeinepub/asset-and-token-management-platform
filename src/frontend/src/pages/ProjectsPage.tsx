import { type Project, UserRole } from "@/backend";
import DevToolsPanel from "@/components/DevToolsPanel";
import ProjectCard from "@/components/ProjectCard";
import ProjectDialog from "@/components/ProjectDialog";
import { Button } from "@/components/ui/button";
import {
  useAssetsByProject,
  useCreateProject,
  useDeleteProject,
  useMyRole,
  useProjects,
  useUpdateProject,
} from "@/hooks/useQueries";
import { FolderOpen, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ProjectCardWrapper({
  project,
  onEdit,
  onDelete,
  canMutate,
}: {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (id: bigint) => void;
  canMutate: boolean;
}) {
  // We need asset count per project; use a simple inline query
  const { data: assets } = useAssetsByProject(project.id);
  return (
    <ProjectCard
      project={project}
      onEdit={onEdit}
      onDelete={onDelete}
      assetCount={assets?.length ?? 0}
      canMutate={canMutate}
    />
  );
}

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: projects, isLoading } = useProjects();
  const { data: role } = useMyRole();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const canMutate = role === UserRole.admin || role === UserRole.user;

  const handleCreateOrUpdate = async (name: string, description: string) => {
    try {
      if (editingProject) {
        await updateProject.mutateAsync({
          id: editingProject.id,
          name,
          description,
        });
        toast.success("Project updated successfully");
      } else {
        await createProject.mutateAsync({ name, description });
        toast.success("Project created successfully");
      }
      setDialogOpen(false);
      setEditingProject(null);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (editingProject
            ? "Failed to update project"
            : "Failed to create project"),
      );
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDelete = async (id: bigint) => {
    if (
      confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      try {
        await deleteProject.mutateAsync(id);
        toast.success("Project deleted successfully");
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete project");
      }
    }
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Projects</h1>
            <p className="text-muted-foreground">
              Manage your digital asset projects.
            </p>
          </div>
          {canMutate && (
            <Button onClick={handleNewProject} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCardWrapper
              key={project.id.toString()}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canMutate={canMutate}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {canMutate
              ? "Start by creating your first project to organize your digital assets."
              : "No projects have been created yet."}
          </p>
          {canMutate && (
            <Button onClick={handleNewProject} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Project
            </Button>
          )}
        </div>
      )}

      <div className="mt-12">
        <DevToolsPanel />
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateOrUpdate}
        project={editingProject}
        isLoading={createProject.isPending || updateProject.isPending}
      />
    </div>
  );
}
