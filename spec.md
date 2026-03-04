# Asset and Token Management Platform

## Current State

- Full Motoko backend with Projects, Assets, Tasks, Collections, Tokens, FileMetadata, RBAC
- Global AccessControl system: `accessControlState.userRoles : Map<Principal, UserRole>` with `#admin | #user | #guest`
- All four delete operations (`deleteProject`, `deleteAsset`, `deleteTask`, `deleteCollection`) gate on `AccessControl.isAdmin`, which reads from `accessControlState.userRoles`
- Separate per-project `projectMembers` store for project-level roles (#admin/#editor/#viewer) -- NOT consulted by delete operations
- Existing `selfAssignAdmin(entityId: Nat)` function writes to `projectMembers` (wrong store) and accepts an entityId parameter (not needed)
- Frontend has a DEV TOOLS panel with entity dropdown and "Assign Admin to Me" button (wired to old per-project implementation)
- Audit log stored in `auditLogs : Map<Nat, AuditLog>`

## Requested Changes (Diff)

### Add
- Nothing new -- reuse all existing types and storage

### Modify
- `selfAssignAdmin` in `backend/main.mo`:
  - Remove `entityId: Nat` parameter entirely
  - Guard: `AccessControl.hasPermission(accessControlState, caller, #user)` (unchanged)
  - Replace the `projectMembers.add(...)` write with a direct `accessControlState.userRoles.add(caller, #admin)` -- bypasses `assignRole`'s internal admin guard
  - Audit log entry: keep writing to `auditLogs`, action `"adminSelfAssign"`, entity = `Principal.toText(caller)` (caller's principal as context, no entity ID)
- Frontend DEV TOOLS panel:
  - Remove entity dropdown (no entityId needed)
  - Keep single "Assign Admin to Me" button calling `selfAssignAdmin()` with no arguments
  - On success: invalidate all role/permission queries (`getCallerRole`, any isAdmin-gated query keys)

### Remove
- Entity existence check and `projectMembers` write from `selfAssignAdmin`
- Entity dropdown from frontend DEV TOOLS panel

## Implementation Plan

1. In `backend/main.mo`, replace the body of `selfAssignAdmin` -- change signature from `(entityId: Nat)` to `()`, replace entity lookup + `projectMembers.add` with `accessControlState.userRoles.add(caller, #admin)`, update audit log entity field to `Principal.toText(caller)`
2. In the React frontend, update the DEV TOOLS panel: remove entity selector state and dropdown, call `selfAssignAdmin()` with no args, ensure React Query invalidation covers `getCallerRole` and any admin-gated query keys
