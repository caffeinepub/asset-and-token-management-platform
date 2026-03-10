import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLogs, useCallerRole } from "@/hooks/useQueries";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 20n;

function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleString();
}

function getActionBadgeVariant(
  action: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (action.startsWith("delete") || action.startsWith("Delete"))
    return "destructive";
  if (
    action.startsWith("create") ||
    action.startsWith("Create") ||
    action === "mintToken"
  )
    return "default";
  if (action.startsWith("update") || action.startsWith("Update"))
    return "secondary";
  return "outline";
}

export default function AuditLogPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const { data: role, isLoading: roleLoading } = useCallerRole();
  const {
    data: auditData,
    isLoading: logsLoading,
    isError: logsError,
  } = useAuditLogs(currentPage, PAGE_SIZE);

  const isAdmin = role === "admin";
  const total = auditData?.total ?? 0n;
  const entries = auditData?.entries ?? [];
  const totalPages = Math.max(1, Math.ceil(Number(total) / Number(PAGE_SIZE)));

  // Loading state — role check
  if (roleLoading) {
    return (
      <div className="container py-12" data-ocid="audit_log.page">
        <div
          className="space-y-4 max-w-5xl mx-auto"
          data-ocid="audit_log.loading_state"
        >
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
          <div className="mt-8 space-y-3">
            {["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"].map((k) => (
              <Skeleton key={k} className="h-14 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Access denied for non-admins
  if (!isAdmin) {
    return (
      <div
        className="container py-12 flex items-center justify-center min-h-[60vh]"
        data-ocid="audit_log.page"
      >
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-destructive/10 p-5">
              <Lock className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Access Denied
          </h1>
          <p className="text-muted-foreground text-lg">
            This page is only accessible to administrators.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4" />
            <span>Admin role required</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (logsError) {
    return (
      <div className="container py-12" data-ocid="audit_log.page">
        <div
          className="flex flex-col items-center justify-center min-h-[300px] text-center"
          data-ocid="audit_log.error_state"
        >
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Failed to load audit logs
          </h3>
          <p className="text-muted-foreground text-sm">
            An error occurred while fetching the audit log. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl" data-ocid="audit_log.page">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-md bg-primary/10 p-2">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        </div>
        <p className="text-muted-foreground">
          Read-only record of all system operations. Accessible to
          administrators only.
        </p>
      </div>

      {/* Loading state for log data */}
      {logsLoading ? (
        <div className="space-y-3" data-ocid="audit_log.loading_state">
          {["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"].map((k) => (
            <Skeleton key={k} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center min-h-[300px] text-center border rounded-lg bg-muted/20"
          data-ocid="audit_log.empty_state"
        >
          <ScrollText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No audit entries yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Audit entries will appear here as operations are performed on
            projects, assets, tasks, collections, and tokens.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-lg border overflow-hidden shadow-sm">
            <Table data-ocid="audit_log.table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold w-[200px]">
                    Timestamp
                  </TableHead>
                  <TableHead className="font-semibold">Principal</TableHead>
                  <TableHead className="font-semibold w-[160px]">
                    Action
                  </TableHead>
                  <TableHead className="font-semibold w-[160px]">
                    Entity
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, idx) => (
                  <TableRow
                    key={`${entry.timestamp.toString()}-${entry.action}-${idx}`}
                    data-ocid={`audit_log.row.${idx + 1}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs max-w-[240px] truncate"
                      title={entry.principal.toString()}
                    >
                      {entry.principal.toString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getActionBadgeVariant(entry.action)}
                        className="font-mono text-xs"
                      >
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {entry.entity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {entries.length} of {Number(total)} entries
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                data-ocid="audit_log.pagination_prev"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm font-medium text-muted-foreground min-w-[100px] text-center">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage >= totalPages - 1}
                data-ocid="audit_log.pagination_next"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
