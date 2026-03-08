# Specification

## Summary
**Goal:** Fix the `<Select.Item>` empty value error that appears when opening the New Task dialog.

**Planned changes:**
- In `TaskDialog.tsx`, replace any `<Select.Item>` with an empty string `value` prop with a non-empty sentinel value (e.g., `"none"` or `"unassigned"`) or use the Shadcn Select `placeholder` prop instead.
- Update form state and submission logic so that selecting the placeholder/sentinel value maps to `null` or an empty value when submitting the task to the backend.

**User-visible outcome:** Opening the New Task dialog no longer produces a React console error about `<Select.Item>` empty values, and task creation with optional fields (e.g., asset, assignee) continues to work correctly.
