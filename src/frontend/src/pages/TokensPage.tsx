import { UserRole } from "@/backend";
import TokenDialog from "@/components/TokenDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  useMintToken,
  useMyRole,
  useProject,
  useTokensByProject,
} from "@/hooks/useQueries";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Coins,
  Hash,
  Loader2,
  Plus,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TokensPage() {
  const { projectId } = useParams({ from: "/tokens/$projectId" });
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useProject(
    BigInt(projectId),
  );
  const { data: tokens, isLoading: tokensLoading } = useTokensByProject(
    BigInt(projectId),
  );
  const { data: role } = useMyRole();
  const mintToken = useMintToken();

  const isAdmin = role === UserRole.admin;

  const handleMint = async (name: string, description: string) => {
    setMintError(null);
    try {
      await mintToken.mutateAsync({
        projectId: BigInt(projectId),
        name,
        description,
        metadata: "",
      });
      toast.success("Token minted successfully");
      setDialogOpen(false);
    } catch (error: any) {
      const msg = error?.message || "Failed to mint token";
      setMintError(msg);
      toast.error(msg);
    }
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
              {project.name} - Tokens
            </h1>
            <p className="text-muted-foreground mb-4">
              View and manage tokens minted for this project.
            </p>
            <Badge variant="secondary">{tokens?.length || 0} tokens</Badge>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                setMintError(null);
                setDialogOpen(true);
              }}
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Mint Token
            </Button>
          )}
        </div>
      </div>

      {mintError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{mintError}</AlertDescription>
        </Alert>
      )}

      {!isAdmin && role !== undefined && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only admins can mint tokens. You are viewing tokens in read-only
            mode.
          </AlertDescription>
        </Alert>
      )}

      {tokensLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tokens && tokens.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => (
            <Card
              key={token.id.toString()}
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {token.name}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    <Coins className="h-3 w-3 mr-1" />
                    Token
                  </Badge>
                </div>
                <CardDescription className="line-clamp-3">
                  {token.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" />
                  <span>ID: {token.id.toString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Minted {formatDate(token.mintedAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate">
                    By: {token.mintedBy.toString().slice(0, 16)}...
                  </span>
                </div>
                {token.metadata && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Metadata:</span>{" "}
                    {token.metadata}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Coins className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No tokens yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {isAdmin
              ? "Mint your first token to represent digital assets for this project."
              : "No tokens have been minted for this project yet."}
          </p>
          {isAdmin && (
            <Button
              onClick={() => {
                setMintError(null);
                setDialogOpen(true);
              }}
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Mint Your First Token
            </Button>
          )}
        </div>
      )}

      <TokenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleMint}
        isLoading={mintToken.isPending}
      />
    </div>
  );
}
