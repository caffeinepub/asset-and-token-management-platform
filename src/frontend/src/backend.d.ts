import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransitionRule {
    id: bigint;
    toStatus: string;
    name: string;
    fromStatus: string;
    createdAt: bigint;
    createdBy: Principal;
    projectId: bigint;
    conditions: string;
}
export interface ProjectMember {
    member: Principal;
    role: ProjectRole;
    addedAt: bigint;
    addedBy: Principal;
    projectId: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface FileMetadata {
    id: bigint;
    assetId?: bigint;
    hash: string;
    size: bigint;
    mimeType: string;
    filename: string;
    projectId: bigint;
    uploadedAt: bigint;
    uploadedBy: Principal;
}
export interface MergeOperation {
    id: bigint;
    status: string;
    completedAt?: bigint;
    createdAt: bigint;
    createdBy: Principal;
    sourceAssetIds: Array<bigint>;
    targetAssetId: bigint;
    projectId: bigint;
}
export interface AuditLog {
    entity: string;
    principal: Principal;
    action: string;
    timestamp: bigint;
}
export interface Task {
    id: bigint;
    status: string;
    assignedTo?: Principal;
    assetId?: bigint;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
    description: string;
    updatedAt: bigint;
    projectId: bigint;
}
export interface PlatformConfig {
    tagline: string;
    accentColor: string;
    platformName: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface Collection {
    id: bigint;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
    description: string;
    updatedAt: bigint;
    projectId: bigint;
    assetIds: Array<bigint>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Asset {
    id: bigint;
    name: string;
    createdAt: Time;
    description: string;
    updatedAt?: Time;
    projectId: bigint;
}
export interface Token {
    id: bigint;
    metadata: string;
    name: string;
    description: string;
    mintedAt: bigint;
    mintedBy: Principal;
    projectId: bigint;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface UserSubscription {
    principal: Principal;
    tier: SubscriptionTier;
    updatedAt: bigint;
}
export interface ValidationRule {
    id: bigint;
    ruleType: string;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
    projectId: bigint;
    conditions: string;
}
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    username: string;
    name: string;
}
export interface Project {
    id: bigint;
    name: string;
    createdAt: Time;
    description: string;
    updatedAt?: Time;
}
export enum ProjectRole {
    admin = "admin",
    editor = "editor",
    viewer = "viewer"
}
export enum SubscriptionTier {
    pro = "pro",
    starter = "starter",
    free = "free"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProjectMember(projectId: bigint, member: Principal, role: ProjectRole): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAsset(projectId: bigint, name: string, description: string): Promise<bigint>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createCollection(projectId: bigint, name: string, description: string, assetIds: Array<bigint>): Promise<bigint>;
    createProject(name: string, description: string): Promise<{
        __kind__: "Ok";
        Ok: bigint;
    } | {
        __kind__: "Err";
        Err: string;
    }>;
    createTask(projectId: bigint, assetId: bigint | null, name: string, description: string, status: string, assignedTo: Principal | null): Promise<bigint>;
    deleteAsset(id: bigint): Promise<void>;
    deleteCollection(id: bigint): Promise<void>;
    deleteFileMetadata(id: bigint): Promise<void>;
    deleteProject(id: bigint): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    getAsset(id: bigint): Promise<Asset | null>;
    getAuditLogs(page: bigint, pageSize: bigint): Promise<{
        total: bigint;
        entries: Array<AuditLog>;
    }>;
    getCallerRole(): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCollection(id: bigint): Promise<Collection | null>;
    getFileMetadata(id: bigint): Promise<FileMetadata | null>;
    getMergeOperation(id: bigint): Promise<MergeOperation | null>;
    getMySubscription(): Promise<UserSubscription | null>;
    getPlatformConfig(): Promise<PlatformConfig | null>;
    getProject(id: bigint): Promise<Project | null>;
    getProjectCountForCaller(): Promise<bigint>;
    getProjectMember(projectId: bigint, member: Principal): Promise<ProjectMember | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTask(id: bigint): Promise<Task | null>;
    getToken(tokenId: bigint): Promise<Token | null>;
    getTransitionRule(id: bigint): Promise<TransitionRule | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getValidationRule(id: bigint): Promise<ValidationRule | null>;
    handleStripePaymentCompleted(tier: SubscriptionTier, user: Principal): Promise<{
        __kind__: "Ok";
        Ok: null;
    } | {
        __kind__: "Err";
        Err: string;
    }>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listAssets(): Promise<Array<Asset>>;
    listAssetsByProject(projectId: bigint): Promise<Array<Asset>>;
    listCollectionsByProject(projectId: bigint): Promise<Array<Collection>>;
    listFileMetadataByAsset(assetId: bigint): Promise<Array<FileMetadata>>;
    listMembersByProject(projectId: bigint): Promise<Array<ProjectMember>>;
    listMergeOperationsByProject(projectId: bigint): Promise<Array<MergeOperation>>;
    listProjects(): Promise<Array<Project>>;
    listTasksByProject(projectId: bigint): Promise<Array<Task>>;
    listTokensByProject(projectId: bigint): Promise<Array<Token>>;
    listTransitionRulesByProject(projectId: bigint): Promise<Array<TransitionRule>>;
    listValidationRulesByProject(projectId: bigint): Promise<Array<ValidationRule>>;
    mintToken(projectId: bigint, name: string, description: string, metadata: string): Promise<{
        __kind__: "Ok";
        Ok: Token;
    } | {
        __kind__: "Err";
        Err: string;
    }>;
    registerUser(username: string): Promise<bigint>;
    removeProjectMember(projectId: bigint, member: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selfAssignAdmin(): Promise<void>;
    setPlatformConfig(config: PlatformConfig): Promise<{
        __kind__: "Ok";
        Ok: null;
    } | {
        __kind__: "Err";
        Err: string;
    }>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    storeFileMetadata(projectId: bigint, assetId: bigint | null, filename: string, mimeType: string, size: bigint, hash: string): Promise<bigint>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAsset(id: bigint, name: string, description: string): Promise<void>;
    updateCollection(id: bigint, name: string, description: string, assetIds: Array<bigint>): Promise<void>;
    updateProject(id: bigint, name: string, description: string): Promise<void>;
    updateProjectMemberRole(projectId: bigint, member: Principal, newRole: ProjectRole): Promise<void>;
    updateTask(id: bigint, name: string, description: string, status: string, assignedTo: Principal | null): Promise<void>;
    upgradeSubscription(tier: SubscriptionTier): Promise<{
        __kind__: "Ok";
        Ok: null;
    } | {
        __kind__: "Err";
        Err: string;
    }>;
}
