import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface FileMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    filename: string;
    mimeType: string;
    size: bigint;
    hash: string;
  }) => void;
  isLoading: boolean;
}

export default function FileMetadataDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: FileMetadataDialogProps) {
  const [filename, setFilename] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [size, setSize] = useState("");
  const [hash, setHash] = useState("");

  useEffect(() => {
    if (!open) {
      setFilename("");
      setMimeType("");
      setSize("");
      setHash("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filename.trim()) {
      onSubmit({
        filename: filename.trim(),
        mimeType: mimeType.trim() || "application/octet-stream",
        size: BigInt(size || "0"),
        hash: hash.trim(),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload File Metadata</DialogTitle>
            <DialogDescription>
              Record file metadata for this project. This stores information
              about a file without uploading the file itself.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="filename">Filename *</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g. document.pdf"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mimeType">MIME Type</Label>
              <Input
                id="mimeType"
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
                placeholder="e.g. application/pdf, image/png"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">File Size (bytes)</Label>
              <Input
                id="size"
                type="number"
                min="0"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 1024"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hash">File Hash</Label>
              <Input
                id="hash"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="e.g. SHA-256 hash of the file"
                disabled={isLoading}
              />
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
            <Button type="submit" disabled={!filename.trim() || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Metadata
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
