import { type Asset, UserRole } from "@/backend";
import AssetDialog from "@/components/AssetDialog";
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
  useAssetsByProject,
  useCreateAsset,
  useDeleteAsset,
  useMyRole,
  useProject,
  useUpdateAsset,
} from "@/hooks/useQueries";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Edit,
  FileBox,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AssetsPage() {
  const { projectId } = useParams({ from: "/assets/$projectId" });
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const { data: project, isLoading: projectLoading } = useProject(
    BigInt(projectId),
  );
  const { data: assets, isLoading: assetsLoading } = useAssetsByProject(
    BigInt(projectId),
  );
  const { data: role } = useMyRole();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const canMutate = role === UserRole.admin || role === UserRole.user;

  const handleCreateOrUpdate = async (name: string, description: string) => {
    try {
      if (editingAsset) {
        await updateAsset.mutateAsync({
          id: editingAsset.id,
          name,
          description,
        });
        toast.success("Asset updated successfully");
      } else {
        await createAsset.mutateAsync({
          projectId: BigInt(projectId),
          name,
          description,
        });
        toast.success("Asset created successfully");
      }
      setDialogOpen(false);
      setEditingAsset(null);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (editingAsset ? "Failed to update asset" : "Failed to create asset"),
      );
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setDialogOpen(true);
  };

  const handleDelete = async (id: bigint) => {
    if (
      confirm(
        "Are you sure you want to delete this asset? This action cannot be undone.",
      )
    ) {
      try {
        await deleteAsset.mutateAsync(id);
        toast.success("Asset deleted successfully");
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete asset");
      }
    }
  };

  const handleNewAsset = () => {
    setEditingAsset(null);
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
              {project.name}
            </h1>
            <p className="text-muted-foreground mb-4">{project.description}</p>
            <Badge variant="secondary">{assets?.length || 0} assets</Badge>
          </div>
          {canMutate && (
            <Button onClick={handleNewAsset} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Asset
            </Button>
          )}
        </div>
      </div>

      {assetsLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : assets && assets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card
              key={asset.id.toString()}
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50"
            >
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {asset.name}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {asset.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created {formatDate(asset.createdAt)}</span>
                </div>
              </CardContent>
              {canMutate && (
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(asset)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(asset.id)}
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
            <FileBox className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No assets yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {canMutate
              ? "Start adding assets to this project to keep track of your resources."
              : "No assets have been added to this project yet."}
          </p>
          {canMutate && (
            <Button onClick={handleNewAsset} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Asset
            </Button>
          )}
        </div>
      )}

      {canMutate && (
        <AssetDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleCreateOrUpdate}
          asset={editingAsset}
          isLoading={createAsset.isPending || updateAsset.isPending}
        />
      )}
    </div>
  );
}
