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
export interface ValidationRule {
    id: bigint;
    ruleType: string;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
    projectId: bigint;
    conditions: string;
}
export interface Project {
    id: bigint;
    name: string;
    createdAt: Time;
    description: string;
    updatedAt?: Time;
}
export interface UserProfile {
    username: string;
    name: string;
}
export enum ProjectRole {
    admin = "admin",
    editor = "editor",
    viewer = "viewer"
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
    createCollection(projectId: bigint, name: string, description: string, assetIds: Array<bigint>): Promise<bigint>;
    createProject(name: string, description: string): Promise<bigint>;
    createTask(projectId: bigint, assetId: bigint | null, name: string, description: string, status: string, assignedTo: Principal | null): Promise<bigint>;
    deleteAsset(id: bigint): Promise<void>;
    deleteCollection(id: bigint): Promise<void>;
    deleteFileMetadata(id: bigint): Promise<void>;
    deleteProject(id: bigint): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    getAsset(id: bigint): Promise<Asset | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCollection(id: bigint): Promise<Collection | null>;
    getFileMetadata(id: bigint): Promise<FileMetadata | null>;
    getMergeOperation(id: bigint): Promise<MergeOperation | null>;
    getProject(id: bigint): Promise<Project | null>;
    getProjectMember(projectId: bigint, member: Principal): Promise<ProjectMember | null>;
    getTask(id: bigint): Promise<Task | null>;
    getToken(tokenId: bigint): Promise<Token | null>;
    getTransitionRule(id: bigint): Promise<TransitionRule | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getValidationRule(id: bigint): Promise<ValidationRule | null>;
    isCallerAdmin(): Promise<boolean>;
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
        __kind__: "ok";
        ok: Token;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerUser(username: string): Promise<bigint>;
    removeProjectMember(projectId: bigint, member: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    storeFileMetadata(projectId: bigint, assetId: bigint | null, filename: string, mimeType: string, size: bigint, hash: string): Promise<bigint>;
    updateAsset(id: bigint, name: string, description: string): Promise<void>;
    updateCollection(id: bigint, name: string, description: string, assetIds: Array<bigint>): Promise<void>;
    updateProject(id: bigint, name: string, description: string): Promise<void>;
    updateProjectMemberRole(projectId: bigint, member: Principal, newRole: ProjectRole): Promise<void>;
    updateTask(id: bigint, name: string, description: string, status: string, assignedTo: Principal | null): Promise<void>;
}
