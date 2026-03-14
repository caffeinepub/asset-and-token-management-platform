import {
  type Asset,
  type AuditLog,
  type Collection,
  type FileMetadata,
  type OnboardingState,
  type PlatformConfig,
  type Project,
  type ProjectRole,
  type ShoppingItem,
  type StripeConfiguration,
  type SubscriptionTier,
  type Task,
  type Token,
  UserRole,
  type UserSubscription,
} from "@/backend";
import { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "./useActor";

// Role
export function useMyRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ["myRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

// Projects
export function useProjects() {
  const { actor, isFetching } = useActor();

  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProject(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Project | null>({
    queryKey: ["project", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProject(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: { name: string; description: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.createProject(name, description);
      if (result.__kind__ === "Err") {
        throw new Error(result.Err);
      }
      return result.Ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projectCount"] });
    },
  });
}

export function useUpdateProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: { id: bigint; name: string; description: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateProject(id, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
      queryClient.invalidateQueries({ queryKey: ["fileMetadata"] });
    },
  });
}

// Assets
export function useAssets() {
  const { actor, isFetching } = useActor();

  return useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAssets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssetsByProject(projectId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Asset[]>({
    queryKey: ["assets", "project", projectId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAssetsByProject(projectId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAsset(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Asset | null>({
    queryKey: ["asset", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAsset(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      description,
    }: { projectId: bigint; name: string; description: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.createAsset(projectId, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useUpdateAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: { id: bigint; name: string; description: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateAsset(id, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useDeleteAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.deleteAsset(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

// Tasks
export function useTasksByProject(projectId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ["tasks", "project", projectId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTasksByProject(projectId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTask(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Task | null>({
    queryKey: ["task", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTask(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      assetId,
      name,
      description,
      status,
      assignedTo,
    }: {
      projectId: bigint;
      assetId: bigint | null;
      name: string;
      description: string;
      status: string;
      assignedTo: string | null;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      const principal = assignedTo ? Principal.fromText(assignedTo) : null;
      return actor.createTask(
        projectId,
        assetId,
        name,
        description,
        status,
        principal,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      status,
      assignedTo,
    }: {
      id: bigint;
      name: string;
      description: string;
      status: string;
      assignedTo: string | null;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      const principal = assignedTo ? Principal.fromText(assignedTo) : null;
      return actor.updateTask(id, name, description, status, principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// Collections
export function useCollectionsByProject(projectId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Collection[]>({
    queryKey: ["collections", "project", projectId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCollectionsByProject(projectId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCollection(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Collection | null>({
    queryKey: ["collection", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCollection(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCollection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      description,
      assetIds,
    }: {
      projectId: bigint;
      name: string;
      description: string;
      assetIds: bigint[];
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.createCollection(projectId, name, description, assetIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useUpdateCollection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      assetIds,
    }: {
      id: bigint;
      name: string;
      description: string;
      assetIds: bigint[];
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateCollection(id, name, description, assetIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useDeleteCollection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.deleteCollection(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

// Tokens
export function useToken(tokenId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Token | null>({
    queryKey: ["token", tokenId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getToken(tokenId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTokensByProject(projectId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Token[]>({
    queryKey: ["tokens", "project", projectId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTokensByProject(projectId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMintToken() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      description,
      metadata,
    }: {
      projectId: bigint;
      name: string;
      description: string;
      metadata: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.mintToken(
        projectId,
        name,
        description,
        metadata,
      );
      if (result.__kind__ === "Err") {
        throw new Error(result.Err);
      }
      return result.Ok;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tokens", "project", variables.projectId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
    },
  });
}

// File Metadata
export function useFileMetadataByProject(projectId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<FileMetadata[]>({
    queryKey: ["fileMetadata", "project", projectId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      const assets = await actor.listAssetsByProject(projectId);
      const allFileMeta: FileMetadata[] = [];
      for (const asset of assets) {
        const metas = await actor.listFileMetadataByAsset(asset.id);
        allFileMeta.push(...metas);
      }
      return allFileMeta;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadFileMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      assetId,
      filename,
      mimeType,
      size,
      hash,
    }: {
      projectId: bigint;
      assetId: bigint | null;
      filename: string;
      mimeType: string;
      size: bigint;
      hash: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.storeFileMetadata(
        projectId,
        assetId,
        filename,
        mimeType,
        size,
        hash,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["fileMetadata", "project", variables.projectId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["fileMetadata"] });
    },
  });
}

export function useDeleteFileMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId: _projectId,
    }: { id: bigint; projectId: bigint }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.deleteFileMetadata(id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["fileMetadata", "project", variables.projectId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["fileMetadata"] });
    },
  });
}

// Subscription
export function useMySubscription() {
  const { actor, isFetching } = useActor();

  return useQuery<UserSubscription | null>({
    queryKey: ["mySubscription"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMySubscription();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProjectCountForCaller() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["projectCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getProjectCountForCaller();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpgradeSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.upgradeSubscription(tier);
      if (result.__kind__ === "Err") {
        throw new Error(result.Err);
      }
      return result.Ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mySubscription"] });
      queryClient.invalidateQueries({ queryKey: ["projectCount"] });
    },
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripeConfigured"] });
      toast.success("Stripe configuration saved");
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : "Failed to save Stripe config";
      toast.error(msg);
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      items,
      successUrl,
      cancelUrl,
    }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      const raw = await actor.createCheckoutSession(
        items,
        successUrl,
        cancelUrl,
      );
      const session = JSON.parse(raw) as { id: string; url: string };
      if (!session?.url) throw new Error("Invalid checkout session response");
      return session;
    },
  });
}

export function useGetStripeSessionStatus(sessionId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["stripeSessionStatus", sessionId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStripeSessionStatus(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.__kind__ === "completed" || data.__kind__ === "failed")
        return false;
      return 2000;
    },
  });
}

// Dev Tools
export function useSelfAssignAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.selfAssignAdmin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRole"] });
      queryClient.invalidateQueries({ queryKey: ["callerRole"] });
      toast.success("Admin role assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to assign admin role");
    },
  });
}

// Audit Logs
export function useCallerRole() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return "guest";
      return actor.getCallerRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAuditLogs(page: number, pageSize: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<{ entries: AuditLog[]; total: bigint }>({
    queryKey: ["auditLogs", page],
    queryFn: async () => {
      if (!actor) return { entries: [], total: 0n };
      return actor.getAuditLogs(BigInt(page), pageSize);
    },
    enabled: !!actor && !isFetching,
  });
}

// Platform Config
export type { PlatformConfig };

export function usePlatformConfig() {
  const { actor, isFetching } = useActor();

  const query = useQuery<PlatformConfig | null>({
    queryKey: ["platformConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPlatformConfig();
    },
    enabled: !!actor && !isFetching,
  });

  const config = query.data;
  return {
    platformName: config?.platformName ?? "Platform",
    tagline: config?.tagline ?? "",
    accentColor: config?.accentColor ?? "#6366f1",
    isLoading: query.isLoading,
    error: query.error,
    raw: config,
  };
}

export function useSetPlatformConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: PlatformConfig) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.setPlatformConfig(config);
      if (result && result.__kind__ === "Err") {
        throw new Error(result.Err);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformConfig"] });
      toast.success("Branding saved");
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : "Failed to save branding";
      toast.error(msg);
    },
  });
}

// Onboarding
export function useMyOnboardingState() {
  const { actor, isFetching } = useActor();

  return useQuery<OnboardingState | null>({
    queryKey: ["myOnboardingState"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyOnboardingState();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateOnboardingStep() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (step: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.updateOnboardingStep(step);
      if (result.__kind__ === "Err") {
        throw new Error(result.Err);
      }
      return result.Ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOnboardingState"] });
    },
  });
}

export function useCompleteOnboarding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.completeOnboarding();
      if (result.__kind__ === "Err") {
        throw new Error(result.Err);
      }
      return result.Ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOnboardingState"] });
    },
  });
}

export function useSkipOnboarding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.skipOnboarding();
      if (result.__kind__ === "Err") {
        throw new Error(result.Err);
      }
      return result.Ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOnboardingState"] });
    },
  });
}

export function useAddProjectMember() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      projectId,
      member,
      role,
    }: {
      projectId: bigint;
      member: Principal;
      role: ProjectRole;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addProjectMember(projectId, member, role);
    },
  });
}
