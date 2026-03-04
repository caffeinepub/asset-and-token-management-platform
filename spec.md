# Asset and Token Management Platform

## Current State

The platform has a fully deployed Motoko backend and React/TypeScript frontend.

**Backend (`src/backend/main.mo`):**
- Entity types: Project, Asset, Task, Collection, User, ValidationRule, TransitionRule, MergeOperation, Token, FileMetadata, AuditEntry, AuditLog
- Stable Maps for all entities with sequential ID counters
- RBAC via `AccessControl` module: `UserRole` (#admin/#user/#guest), `hasPermission`, `isAdmin`
- Per-entity role map: `projectMembers: Map<Text, ProjectMember>` keyed by `"entityId:principal"`, stores `ProjectRole` (#admin/#editor/#viewer)
- `makeMemberKey(entityId, principal)` helper already exists
- `auditLogs: Map<Nat, AuditLog>` with `nextAuditLogId` counter; `AuditLog = { timestamp: Int; principal: Principal; action: Text; entity: Text }`
- Full CRUD for all entities, paginated audit log query, role queries

**Frontend (`src/frontend/src/`):**
- React + TypeScript + Tailwind + shadcn/ui + TanStack Router + TanStack Query
- Pages: ProjectsPage, AssetsPage, TasksPage, CollectionsPage, TokensPage, FileMetadataPage, AuditLogPage
- `useQueries.ts`: hooks for all backend operations including `useProjects`, `useAssets`, `useTasksByProject`, `useCollectionsByProject`, `useMyRole`
- `backend.d.ts`: typed interface auto-generated from backend

## Requested Changes (Diff)

### Add

**Backend:**
- `selfAssignAdmin(entityId: Nat): async ()` — public shared function that:
  1. Checks caller has a valid user session via `AccessControl.hasPermission(accessControlState, caller, #user)` (traps if guest/unauthenticated)
  2. Verifies the entity exists in at least one of: `projects`, `assets`, `tasks`, `collections` (traps with "Entity not found" if none match)
  3. Writes `{ projectId = entityId; member = caller; role = #admin; addedAt = Time.now(); addedBy = caller }` to `projectMembers` using `makeMemberKey(entityId, caller)` as the key
  4. Appends an `AuditLog` entry: `{ timestamp = Time.now(); principal = caller; action = "adminSelfAssign"; entity = entityId.toText() }` to `auditLogs` with `nextAuditLogId`

**Frontend hooks (`useQueries.ts`):**
- `useSelfAssignAdmin()` mutation hook that calls `actor.selfAssignAdmin(entityId: bigint)`, then on success invalidates query keys: `['projects']`, `['assets']`, `['tasks']`, `['collections']`, `['projectMembers']`

**Frontend component (`DevToolsPanel.tsx`):**
- Visually distinct amber-bordered panel, always rendered unconditionally, clearly labeled "DEV TOOLS"
- Aggregates entities from `useProjects()`, `useAssets()`, and all tasks/collections (using project-scoped queries across all projects)
- Dropdown (`Select`) with grouped options: Projects, Assets, Tasks, Collections — each item shows entity name and ID
- "Assign Admin to Me" button calling `selfAssignAdmin` with the selected entity ID
- On success: toast confirmation + invalidate role queries
- On error: toast error message
- Deterministic `data-ocid` markers on all interactive elements

### Modify

**Frontend (`ProjectsPage.tsx`):**
- Import and render `<DevToolsPanel />` below the projects grid (always rendered, not role-gated)

### Remove

Nothing removed.

## Implementation Plan

1. **Generate Motoko backend** — regenerate `main.mo` with the `selfAssignAdmin` function added after the existing `removeProjectMember` function, before the TOKEN MANAGEMENT section. No new types or storage structures needed.

2. **Add `useSelfAssignAdmin` hook** — add to `useQueries.ts`, mutation calling `actor.selfAssignAdmin(entityId)`, invalidates `['projects']`, `['assets']`, `['tasks']`, `['collections']`, `['projectMembers']` on success.

3. **Create `DevToolsPanel` component** — amber `border-2 border-amber-500` card with "DEV TOOLS" header badge, entity type selector (grouped Select), entity instance selector, and "Assign Admin to Me" primary button. Uses all existing list queries; for tasks/collections iterates across all available projects. Shows loading/error states inline.

4. **Wire into ProjectsPage** — add `<DevToolsPanel />` at the bottom of the page container, unconditionally.
