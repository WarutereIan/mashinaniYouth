import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, FileSearch, Loader2, Lock, Unlock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  adminUnsealCycleFn,
  listElectionCycles,
  listRecentAudit,
  recountPosition,
  type AuditLogEntry,
  type RecountResult,
} from "@/lib/api/admin";
import { adminRouteLoader } from "@/lib/admin-loader";
import { listPositions } from "@/lib/api/positions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Cycle = Awaited<ReturnType<typeof listElectionCycles>>[number];

export const Route = createFileRoute("/admin/audit")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoader(location.pathname);
    const [positions, cycles, auditLog] = await Promise.all([
      listPositions({ cycleSlug: "mykdm-2026" }),
      listElectionCycles(),
      listRecentAudit(50),
    ]);
    const recounts = await Promise.all(
      positions.map(async (p) => {
        try {
          const result = await recountPosition(p.id);
          return { position: p, result };
        } catch {
          return {
            position: p,
            result: null as RecountResult | null,
          };
        }
      }),
    );
    return { admin, cycles, auditLog, recounts };
  },
  head: () => ({
    meta: [{ title: "Admin Audit — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const { admin, cycles: initialCycles, auditLog: initialAudit, recounts } = Route.useLoaderData();
  const [cycles, setCycles] = useState(initialCycles);
  const [auditLog] = useState(initialAudit);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const isSuperadmin = admin.role === "superadmin";

  const unseal = async (cycle: Cycle) => {
    if (!window.confirm(`Unseal cycle "${cycle.name}"? This re-opens voting after tally.`)) return;
    setBusySlug(cycle.slug);
    try {
      await adminUnsealCycleFn({ data: { cycleSlug: cycle.slug } });
      setCycles((rows) =>
        rows.map((row) => (row.slug === cycle.slug ? { ...row, phase: "closed" } : row)),
      );
      toast.success(`Unsealed ${cycle.slug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unseal failed");
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" /> Admin dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <FileSearch className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl">Audit & reconciliation</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cycle seal status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cycles.map((cycle) => (
              <div
                key={cycle.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div>
                  <div className="font-medium">{cycle.name}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {cycle.slug}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cycle.phase === "tallied" ? "default" : "secondary"}>
                    {cycle.phase === "tallied" ? (
                      <>
                        <Lock className="mr-1 h-3 w-3" /> Sealed
                      </>
                    ) : (
                      cycle.phase
                    )}
                  </Badge>
                  {isSuperadmin && cycle.phase === "tallied" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void unseal(cycle)}
                      disabled={busySlug === cycle.slug}
                    >
                      {busySlug === cycle.slug ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Unlock className="mr-1 h-3.5 w-3.5" />
                      )}
                      Unseal
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {cycles.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No election cycles configured.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Per-position recount</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Declared</TableHead>
                  <TableHead className="text-right">Recounted</TableHead>
                  <TableHead className="text-center">Match</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recounts.map(({ position, result }) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">{position.title}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {result ? result.declared_total.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {result ? result.recounted_total.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {result ? (
                        result.match ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-sage" />
                        ) : (
                          <XCircle className="mx-auto h-4 w-4 text-flag-red" />
                        )
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {recounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No positions to recount.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent audit log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry: AuditLogEntry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.actor_email ?? entry.actor_user_id ?? "—"}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{entry.action}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.target_type && entry.target_id
                        ? `${entry.target_type}:${entry.target_id}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {auditLog.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No audit entries yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
      <SiteFooter />
    </div>
  );
}
