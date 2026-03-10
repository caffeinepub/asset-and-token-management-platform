# Asset and Token Management Platform

## Current State

Full-stack platform with Motoko backend and React/TypeScript frontend. Backend includes Projects/Assets/Tasks/Collections CRUD, RBAC (global admin + project-level roles), audit logging, token minting, subscription tiers with Stripe, and platform branding config (`getPlatformConfig` / `setPlatformConfig`). Frontend has authenticated-only routes: Projects, Assets, Tasks, Collections, Tokens, Files, Audit Log, payment success/failure pages.

Known bug: `backend.d.ts` does not expose `getPlatformConfig` or `setPlatformConfig` in the `backendInterface`. The `useQueries.ts` hooks work around this with `(actor as any)` casts, but at runtime the anonymous actor and authenticated actor may not have these methods resolved correctly, causing the "actor.setPlatformConfig is not a function" error.

## Requested Changes (Diff)

### Add
- `getPlatformConfig` and `setPlatformConfig` to the generated `backendInterface` in `backend.d.ts` (via backend re-generation)
- `PlatformConfig` interface added to `backend.d.ts`
- Public landing page route at `/landing` rendered for unauthenticated visitors only
- `LandingPage` component that:
  - Calls `getPlatformConfig()` via the anonymous (unauthenticated) actor on mount
  - Displays `platformName` as primary heading styled with `accentColor`
  - Displays `tagline` as secondary line
  - Shows a single "Sign In with Internet Identity" CTA button
  - Triggers real II login on click; redirects to `/` on success
  - If already authenticated, redirects immediately to `/` without rendering
  - Shows a loading skeleton while config resolves (no flash of defaults)
  - Falls back to `platformName="Platform"`, `tagline=""`, `accentColor="#6366f1"` if config is null
- `useQueries.ts` updated to remove `(actor as any)` casts and use proper typed calls

### Modify
- `App.tsx`: add `/landing` route; update root `/` route so unauthenticated users are redirected to `/landing`
- `useQueries.ts`: update `usePlatformConfig` and `useSetPlatformConfig` to use typed actor calls (after bindings are regenerated)

### Remove
- Nothing removed from existing functionality

## Implementation Plan

1. Regenerate Motoko backend to rebuild `backend.d.ts` with `getPlatformConfig` and `setPlatformConfig` in the `backendInterface` and `PlatformConfig` type exported
2. Create `src/frontend/src/pages/LandingPage.tsx` with the full spec above
3. Update `App.tsx` to add `/landing` route and auth guard on root route
4. Update `useQueries.ts` `usePlatformConfig` and `useSetPlatformConfig` to remove `as any` casts
5. Validate and deploy
