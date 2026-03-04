import { type Collection, UserRole } from "@/backend";
import CollectionDialog from "@/components/CollectionDialog";
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
  useCollectionsByProject,
  useCreateCollection,
  useDeleteCollection,
  useMyRole,
  useProject,
  useUpdateCollection,
} from "@/hooks/useQueries";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Edit,
  FolderKanban,
  Loader2,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CollectionsPage() {
  const { projectId } = useParams({ from: "/collections/$projectId" });
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );

  const { data: project, isLoading: projectLoading } = useProject(
    BigInt(projectId),
  );
  const { data: collections, isLoading: collectionsLoading } =
    useCollectionsByProject(BigInt(projectId));
  const { data: role } = useMyRole();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const canMutate = role === UserRole.admin || role === UserRole.user;

  const handleCreateOrUpdate = async (
    name: string,
    description: string,
    assetIds: bigint[],
  ) => {
    try {
      if (editingCollection) {
        await updateCollection.mutateAsync({
          id: editingCollection.id,
          name,
          description,
          assetIds,
        });
        toast.success("Collection updated successfully");
      } else {
        await createCollection.mutateAsync({
          projectId: BigInt(projectId),
          name,
          description,
          assetIds,
        });
        toast.success("Collection created successfully");
      }
      setDialogOpen(false);
      setEditingCollection(null);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (editingCollection
            ? "Failed to update collection"
            : "Failed to create collection"),
      );
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setDialogOpen(true);
  };

  const handleDelete = async (id: bigint) => {
    if (
      confirm(
        "Are you sure you want to delete this collection? This action cannot be undone.",
      )
    ) {
      try {
        await deleteCollection.mutateAsync(id);
        toast.success("Collection deleted successfully");
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete collection");
      }
    }
  };

  const handleNewCollection = () => {
    setEditingCollection(null);
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
              {project.name} - Collections
            </h1>
            <p className="text-muted-foreground mb-4">
              Group and organize assets into collections.
            </p>
            <Badge variant="secondary">
              {collections?.length || 0} collections
            </Badge>
          </div>
          {canMutate && (
            <Button onClick={handleNewCollection} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Collection
            </Button>
          )}
        </div>
      </div>

      {collectionsLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : collections && collections.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card
              key={collection.id.toString()}
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50"
            >
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {collection.name}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {collection.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created {formatDate(collection.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span>{collection.assetIds.length} assets</span>
                </div>
              </CardContent>
              {canMutate && (
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(collection)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(collection.id)}
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
            <FolderKanban className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {canMutate
              ? "Start creating collections to group related assets together."
              : "No collections have been created for this project yet."}
          </p>
          {canMutate && (
            <Button onClick={handleNewCollection} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Collection
            </Button>
          )}
        </div>
      )}

      {canMutate && (
        <CollectionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleCreateOrUpdate}
          collection={editingCollection}
          projectId={BigInt(projectId)}
          isLoading={createCollection.isPending || updateCollection.isPending}
        />
      )}
    </div>
  );
}
