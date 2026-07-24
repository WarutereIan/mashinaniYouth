import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Loader2, RotateCcw, Search, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { adminDeleteCandidateFn, adminSetCandidateStatusFn, listAllCandidates } from "@/lib/api/admin";
import { adminRouteLoader } from "@/lib/admin-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{value || "—"}</dd>
    </div>
  );
}

function matchesSearch(candidate: CandidateRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    candidate.full_name,
    candidate.national_id,
    candidate.phone,
    candidate.email,
    candidate.iebc_voter_number,
    candidate.position_title,
    candidate.tier,
    candidate.status,
    candidate.county,
    candidate.constituency,
    candidate.ward,
    candidate.party,
    candidate.slogan,
    candidate.bio,
    candidate.certificate_number,
    candidate.gender,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function AdminCandidatesPage() {
  const { candidates: initialCandidates, admin } = Route.useLoaderData();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CandidateRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const canAct = admin.role !== "viewer";

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return matchesSearch(c, search);
    });
  }, [candidates, statusFilter, search]);

  const counts = useMemo(() => {
    const searched = candidates.filter((c) => matchesSearch(c, search));
    const next = { all: searched.length, pending: 0, approved: 0, rejected: 0 };
    for (const c of searched) {
      if (c.status === "pending") next.pending += 1;
      else if (c.status === "approved") next.approved += 1;
      else if (c.status === "rejected") next.rejected += 1;
    }
    return next;
  }, [candidates, search]);

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
      const updated = { ...candidate, status };
      setCandidates((rows) =>
        rows.map((row) => (row.id === candidate.id ? { ...row, status } : row)),
      );
      setSelected((current) => (current?.id === candidate.id ? updated : current));
      const label =
        status === "approved"
          ? "Approved"
          : status === "rejected"
            ? "Rejected"
            : "Reverted to pending";
      toast.success(`${label}: ${candidate.full_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const deleteCandidate = async (candidate: CandidateRow) => {
    if (
      !window.confirm(
        `Permanently delete candidate "${candidate.full_name}"?\n\nThis also removes any votes cast for them and cannot be undone.`,
      )
    ) {
      return;
    }
    setBusyId(candidate.id);
    try {
      await adminDeleteCandidateFn({ data: { candidateId: candidate.id } });
      setCandidates((rows) => rows.filter((row) => row.id !== candidate.id));
      setSelected((current) => (current?.id === candidate.id ? null : current));
      toast.success(`Deleted ${candidate.full_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const actionButtons = (candidate: CandidateRow, stopPropagation = false) => (
    <div
      className="flex flex-wrap justify-end gap-2"
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
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
      {canAct && (
        <Button
          size="sm"
          variant="outline"
          className="border-flag-red/40 text-flag-red hover:bg-flag-red/10"
          onClick={() => void deleteCandidate(candidate)}
          disabled={busyId === candidate.id}
          title="Delete candidate"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

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
              Review and control all candidate applications — click a row for full details.
            </p>
            <div className="relative mt-4 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, phone, position, location…"
                className="pl-9"
              />
            </div>
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
                  <TableRow
                    key={candidate.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(candidate)}
                  >
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
                    <TableCell className="text-right">{actionButtons(candidate, true)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {search.trim()
                        ? "No candidates match your search."
                        : "No candidates in this filter."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">{selected.full_name}</DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(selected.status)}`}
                    >
                      {selected.status}
                    </span>
                    <span className="text-xs uppercase text-muted-foreground">{selected.tier}</span>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  <section>
                    <h3 className="mb-3 text-sm font-semibold">Identity</h3>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DetailField label="Full name" value={selected.full_name} />
                      <DetailField label="National ID" value={selected.national_id} />
                      <DetailField label="Phone" value={selected.phone} />
                      <DetailField label="Email" value={selected.email} />
                      <DetailField label="IEBC voter number" value={selected.iebc_voter_number} />
                      <DetailField label="Date of birth" value={selected.date_of_birth} />
                      <DetailField label="Gender" value={selected.gender} />
                    </dl>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold">Candidacy</h3>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DetailField label="Position" value={selected.position_title} />
                      <DetailField label="Position ID" value={selected.position_id} />
                      <DetailField label="Tier" value={selected.tier} />
                      <DetailField
                        label="Location"
                        value={
                          [selected.county, selected.constituency, selected.ward]
                            .filter(Boolean)
                            .join(" › ") || "—"
                        }
                      />
                      <DetailField label="Party" value={selected.party} />
                      <DetailField label="Slogan" value={selected.slogan} />
                      <DetailField
                        label="Certificate"
                        value={selected.certificate_number}
                      />
                      <DetailField
                        label="Certified at"
                        value={formatDate(selected.certified_at)}
                      />
                    </dl>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold">Bio</h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {selected.bio?.trim() || "No bio provided."}
                    </p>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold">Review metadata</h3>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DetailField label="Submitted" value={formatDate(selected.created_at)} />
                      <DetailField label="Last updated" value={formatDate(selected.updated_at)} />
                      <DetailField label="Reviewed at" value={formatDate(selected.reviewed_at)} />
                      <DetailField label="Reviewed by" value={selected.reviewed_by} />
                      <DetailField label="Auth user ID" value={selected.user_id} />
                      <DetailField label="Photo path" value={selected.photo_path} />
                    </dl>
                  </section>
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                  {actionButtons(selected)}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>
      <SiteFooter />
    </div>
  );
}
