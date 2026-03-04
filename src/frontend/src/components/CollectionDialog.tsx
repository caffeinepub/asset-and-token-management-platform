import type { Collection } from "@/backend";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAssetsByProject } from "@/hooks/useQueries";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description: string, assetIds: bigint[]) => void;
  collection: Collection | null;
  projectId: bigint;
  isLoading: boolean;
}

export default function CollectionDialog({
  open,
  onOpenChange,
  onSubmit,
  collection,
  projectId,
  isLoading,
}: CollectionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set(),
  );

  const { data: assets } = useAssetsByProject(projectId);

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description);
      setSelectedAssetIds(
        new Set(collection.assetIds.map((id) => id.toString())),
      );
    } else {
      setName("");
      setDescription("");
      setSelectedAssetIds(new Set());
    }
  }, [collection]);

  const handleAssetToggle = (assetId: string) => {
    const newSelected = new Set(selectedAssetIds);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssetIds(newSelected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assetIds = Array.from(selectedAssetIds).map((id) => BigInt(id));
    onSubmit(name, description, assetIds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {collection ? "Edit Collection" : "Create New Collection"}
          </DialogTitle>
          <DialogDescription>
            {collection
              ? "Update the collection details below."
              : "Fill in the details to create a new collection."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter collection name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter collection description"
                rows={3}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Select Assets</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {assets && assets.length > 0 ? (
                  <div className="space-y-3">
                    {assets.map((asset) => (
                      <div
                        key={asset.id.toString()}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`asset-${asset.id.toString()}`}
                          checked={selectedAssetIds.has(asset.id.toString())}
                          onCheckedChange={() =>
                            handleAssetToggle(asset.id.toString())
                          }
                        />
                        <label
                          htmlFor={`asset-${asset.id.toString()}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {asset.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No assets available in this project.
                  </p>
                )}
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedAssetIds.size} asset(s) selected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {collection ? "Update Collection" : "Create Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
