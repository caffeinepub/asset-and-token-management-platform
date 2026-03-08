import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, Loader2, Files, Trash2, Calendar, User, AlertCircle } from 'lucide-react';
import FileMetadataDialog from '@/components/FileMetadataDialog';
import {
  useProject,
  useFileMetadataByProject,
  useUploadFileMetadata,
  useDeleteFileMetadata,
  useMyRole,
} from '@/hooks/useQueries';
import { UserRole } from '@/backend';
import { toast } from 'sonner';

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function FileMetadataPage() {
  const { projectId } = useParams({ from: '/files/$projectId' });
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useProject(BigInt(projectId));
  const { data: files, isLoading: filesLoading } = useFileMetadataByProject(BigInt(projectId));
  const { data: role } = useMyRole();
  const uploadFileMetadata = useUploadFileMetadata();
  const deleteFileMetadata = useDeleteFileMetadata();

  const canMutate = role === UserRole.admin || role === UserRole.user;

  const handleUpload = async (data: { filename: string; mimeType: string; size: bigint; hash: string }) => {
    setUploadError(null);
    try {
      await uploadFileMetadata.mutateAsync({
        projectId: BigInt(projectId),
        assetId: null,
        filename: data.filename,
        mimeType: data.mimeType,
        size: data.size,
        hash: data.hash,
      });
      toast.success('File metadata uploaded successfully');
      setDialogOpen(false);
    } catch (error: any) {
      const msg = error?.message || 'Failed to upload file metadata';
      setUploadError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (confirm('Are you sure you want to delete this file metadata record? This action cannot be undone.')) {
      try {
        await deleteFileMetadata.mutateAsync({ id, projectId: BigInt(projectId) });
        toast.success('File metadata deleted successfully');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete file metadata');
      }
    }
  };

  const formatDate = (timestamp?: bigint) => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate({ to: '/' })}>
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
        <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{project.name} - Files</h1>
            <p className="text-muted-foreground mb-4">Manage file metadata records for this project.</p>
            <Badge variant="secondary">{files?.length || 0} files</Badge>
          </div>
          {canMutate && (
            <Button onClick={() => { setUploadError(null); setDialogOpen(true); }} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Upload Metadata
            </Button>
          )}
        </div>
      </div>

      {uploadError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {filesLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : files && files.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>MIME Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Uploaded
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    By
                  </div>
                </TableHead>
                {canMutate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id.toString()}>
                  <TableCell className="font-medium">{file.filename}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {file.mimeType || 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatBytes(file.size)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono max-w-[120px] truncate">
                    {file.hash || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(file.uploadedAt)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {file.uploadedBy.toString().slice(0, 10)}...
                  </TableCell>
                  {canMutate && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        disabled={deleteFileMetadata.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Files className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No file records yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {canMutate
              ? 'Start recording file metadata to track files associated with this project.'
              : 'No file metadata records have been added to this project yet.'}
          </p>
          {canMutate && (
            <Button onClick={() => { setUploadError(null); setDialogOpen(true); }} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Upload Your First File Metadata
            </Button>
          )}
        </div>
      )}

      {canMutate && (
        <FileMetadataDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleUpload}
          isLoading={uploadFileMetadata.isPending}
        />
      )}
    </div>
  );
}
