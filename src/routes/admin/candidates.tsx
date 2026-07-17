import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { adminSetCandidateStatusFn, listAllCandidates } from "@/lib/api/admin";
import { adminRouteLoader } from "@/lib/admin-loader";
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

type CandidateRow = Awaited<ReturnType<typeof listAllCandidates>>[number];
type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const Route = createFileRoute("/admin/candidates")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoader(location.pathname);
    const candidates = await listAllCandidates();
    return { candidates, admin };
  },
  head: () => ({
    meta: [{ title: "Admin Candidates — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminCandidatesPage,
});

function statusBadgeClass(status: string) {
  if (status === "approved") return "bg-sage/15 text-sage";
  if (status === "rejected") return "bg-flag-red/10 text-flag-red";
  return "bg-muted text-muted-foreground";
}

function AdminCandidatesPage() {
  const { candidates: initialCandidates, admin } = Route.useLoaderData();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const canAct = admin.role !== "viewer";

  const filtered = useMemo(() => {
    if (statusFilter === "all") return candidates;
    return candidates.filter((c) => c.status === statusFilter);
  }, [candidates, statusFilter]);

  const counts = useMemo(() => {
    const next = { all: candidates.length, pending: 0, approved: 0, rejected: 0 };
    for (const c of candidates) {
      if (c.status === "pending") next.pending += 1;
      else if (c.status === "approved") next.approved += 1;
      else if (c.status === "rejected") next.rejected += 1;
    }
    return next;
  }, [candidates]);

  const setStatus = async (
    candidate: CandidateRow,
    status: "pending" | "approved" | "rejected",
  ) => {
    let reason: string | undefined;
    if (status === "rejected") {
      const input = window.prompt("Optional rejection reason", "");
      if (input === null) return;
      reason = input.trim() || undefined;
    }
    setBusyId(candidate.id);
    try {
      await adminSetCandidateStatusFn({
        data: { candidateId: candidate.id, status, reason },
      });
      setCandidates((rows) =>
        rows.map((row) => (row.id === candidate.id ? { ...row, status } : row)),
      );
      const label =
        status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Reverted to pending";
      toast.success(`${label}: ${candidate.full_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" /> Admin dashboard
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-3xl">Candidate management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review and control all candidate applications — pending, approved, or rejected.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  size="sm"
                  variant={statusFilter === tab.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(tab.value)}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-70">({counts[tab.value]})</span>
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.full_name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(candidate.status)}`}
                      >
                        {candidate.status}
                      </span>
                    </TableCell>
                    <TableCell className="uppercase">{candidate.tier}</TableCell>
                    <TableCell>{candidate.position_title}</TableCell>
                    <TableCell>
                      {[candidate.county, candidate.constituency, candidate.ward]
                        .filter(Boolean)
                        .join(" › ") || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {candidate.status !== "approved" && (
                          <Button
                            size="sm"
                            className="bg-sage text-sage-foreground hover:bg-sage/90"
                            onClick={() => void setStatus(candidate, "approved")}
                            disabled={busyId === candidate.id || !canAct}
                          >
                            {busyId === candidate.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                        )}
                        {candidate.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-flag-red/40 text-flag-red hover:bg-flag-red/10"
                            onClick={() => void setStatus(candidate, "rejected")}
                            disabled={busyId === candidate.id || !canAct}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                          </Button>
                        )}
                        {candidate.status !== "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void setStatus(candidate, "pending")}
                            disabled={busyId === candidate.id || !canAct}
                          >
                            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Pending
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No candidates in this filter.
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
