import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetAuditLogs, useGetCallerRole } from "@/hooks/useQueries";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 20;

function formatTimestamp(timestamp: bigint): string {
  // timestamp is in nanoseconds; convert to milliseconds
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleString();
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 20) return principal;
  return `${principal.slice(0, 8)}...${principal.slice(-6)}`;
}

export default function AuditLogPage() {
  const [currentPage, setCurrentPage] = useState(0);

  const { data: role, isLoading: roleLoading } = useGetCallerRole();
  const isAdmin = role === "admin";

  const {
    data: auditData,
    isLoading: logsLoading,
    isFetching: logsFetching,
  } = useGetAuditLogs(currentPage, PAGE_SIZE);

  const entries = auditData?.entries ?? [];
  const total = auditData?.total ?? 0n;
  const totalPages = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE));

  const handlePrevious = () => setCurrentPage((p) => Math.max(0, p - 1));
  const handleNext = () =>
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  if (roleLoading) {
    return (
      <div className="container py-8 max-w-6xl">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-8 max-w-2xl">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view the Audit Log. This page is
            restricted to administrators only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-6 flex items-center gap-3">
        <ClipboardList className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Read-only record of all system actions. Showing page{" "}
            {currentPage + 1} of {totalPages}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Log Entries</CardTitle>
          <CardDescription>
            {Number(total) === 0
              ? "No audit log entries found."
              : `${Number(total)} total entr${Number(total) === 1 ? "y" : "ies"}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="p-6 space-y-3">
              {["row-1", "row-2", "row-3", "row-4", "row-5"].map((id) => (
                <Skeleton key={id} className="h-10 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <ClipboardList className="h-10 w-10 opacity-30" />
              <p className="text-sm">No log entries on this page.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Timestamp</TableHead>
                    <TableHead className="w-[180px]">Principal</TableHead>
                    <TableHead className="w-[160px]">Action</TableHead>
                    <TableHead>Entity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, idx) => (
                    <TableRow
                      key={`${entry.timestamp.toString()}-${entry.principal?.toString()}-${idx}`}
                      className={
                        logsFetching ? "opacity-50 transition-opacity" : ""
                      }
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </TableCell>
                      <TableCell
                        className="font-mono text-xs"
                        title={entry.principal.toString()}
                      >
                        {truncatePrincipal(entry.principal.toString())}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                          {entry.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.entity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">
                {currentPage + 1}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentPage === 0 || logsFetching}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage >= totalPages - 1 || logsFetching}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
