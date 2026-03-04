import { type Task, UserRole } from "@/backend";
import TaskDialog from "@/components/TaskDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCreateTask,
  useDeleteTask,
  useMyRole,
  useProject,
  useTasksByProject,
  useUpdateTask,
} from "@/hooks/useQueries";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Edit,
  ListTodo,
  Loader2,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TasksPage() {
  const { projectId } = useParams({ from: "/tasks/$projectId" });
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: project, isLoading: projectLoading } = useProject(
    BigInt(projectId),
  );
  const { data: tasks, isLoading: tasksLoading } = useTasksByProject(
    BigInt(projectId),
  );
  const { data: role } = useMyRole();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const canMutate = role === UserRole.admin || role === UserRole.user;

  const handleCreateOrUpdate = async (
    name: string,
    description: string,
    status: string,
    assetId: bigint | null,
    assignedTo: string | null,
  ) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({
          id: editingTask.id,
          name,
          description,
          status,
          assignedTo,
        });
        toast.success("Task updated successfully");
      } else {
        await createTask.mutateAsync({
          projectId: BigInt(projectId),
          assetId,
          name,
          description,
          status,
          assignedTo,
        });
        toast.success("Task created successfully");
      }
      setDialogOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (editingTask ? "Failed to update task" : "Failed to create task"),
      );
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = async (id: bigint) => {
    if (
      confirm(
        "Are you sure you want to delete this task? This action cannot be undone.",
      )
    ) {
      try {
        await deleteTask.mutateAsync(id);
        toast.success("Task deleted successfully");
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete task");
      }
    }
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const formatDate = (timestamp?: bigint) => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "in-progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  if (projectLoading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h3 className="text-xl font-semibold mb-2">Project not found</h3>
          <p className="text-muted-foreground mb-6">
            The project you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/" })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {project.name} - Tasks
            </h1>
            <p className="text-muted-foreground mb-4">
              Manage tasks and track progress for this project.
            </p>
            <Badge variant="secondary">{tasks?.length || 0} tasks</Badge>
          </div>
          {canMutate && (
            <Button onClick={handleNewTask} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {tasksLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card
              key={task.id.toString()}
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {task.name}
                  </CardTitle>
                  <Badge
                    className={getStatusColor(task.status)}
                    variant="outline"
                  >
                    {task.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-3">
                  {task.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created {formatDate(task.createdAt)}</span>
                </div>
                {task.assignedTo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate">
                      Assigned to: {task.assignedTo.toString().slice(0, 10)}...
                    </span>
                  </div>
                )}
              </CardContent>
              {canMutate && (
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(task)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <ListTodo className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {canMutate
              ? "Start creating tasks to organize and track work for this project."
              : "No tasks have been created for this project yet."}
          </p>
          {canMutate && (
            <Button onClick={handleNewTask} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Task
            </Button>
          )}
        </div>
      )}

      {canMutate && (
        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleCreateOrUpdate}
          task={editingTask}
          projectId={BigInt(projectId)}
          isLoading={createTask.isPending || updateTask.isPending}
        />
      )}
    </div>
  );
}
