import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  adminApproveCandidateFn,
  adminRejectCandidateFn,
  listPendingCandidates,
} from "@/lib/api/admin";
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

type PendingCandidate = Awaited<ReturnType<typeof listPendingCandidates>>[number];

export const Route = createFileRoute("/admin/candidates")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoader(location.pathname);
    const candidates = await listPendingCandidates();
    return { candidates, admin };
  },
  head: () => ({
    meta: [{ title: "Admin Candidates — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminCandidatesPage,
});

function AdminCandidatesPage() {
  const { candidates: initialCandidates, admin } = Route.useLoaderData();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [busyId, setBusyId] = useState<string | null>(null);
  const canAct = admin.role !== "viewer";

  const approve = async (candidate: PendingCandidate) => {
    setBusyId(candidate.id);
    try {
      await adminApproveCandidateFn({ data: { candidateId: candidate.id } });
      setCandidates((rows) => rows.filter((row) => row.id !== candidate.id));
      toast.success(`Approved ${candidate.full_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (candidate: PendingCandidate) => {
    const reason = window.prompt("Optional rejection reason", "");
    setBusyId(candidate.id);
    try {
      await adminRejectCandidateFn({
        data: { candidateId: candidate.id, reason: reason?.trim() || undefined },
      });
      setCandidates((rows) => rows.filter((row) => row.id !== candidate.id));
      toast.success(`Rejected ${candidate.full_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rejection failed");
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
            <CardTitle className="font-display text-3xl">Pending candidate approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.full_name}</TableCell>
                    <TableCell className="uppercase">{candidate.tier}</TableCell>
                    <TableCell>{candidate.position_title}</TableCell>
                    <TableCell>
                      {candidate.ward ?? candidate.constituency ?? candidate.county}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-sage text-sage-foreground hover:bg-sage/90"
                          onClick={() => void approve(candidate)}
                          disabled={busyId === candidate.id || !canAct}
                        >
                          {busyId === candidate.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-flag-red/40 text-flag-red hover:bg-flag-red/10"
                          onClick={() => void reject(candidate)}
                          disabled={busyId === candidate.id || !canAct}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {candidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No pending candidates.
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
