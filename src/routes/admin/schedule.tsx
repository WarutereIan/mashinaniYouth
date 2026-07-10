import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { adminSetCyclePhaseFn, listElectionCycles, listPollWindows } from "@/lib/api/admin";
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

const PHASES = ["draft", "scheduled", "open", "closed", "tallied", "cancelled"] as const;
type Phase = (typeof PHASES)[number];
type Cycle = Awaited<ReturnType<typeof listElectionCycles>>[number] & {
  pollWindows: Awaited<ReturnType<typeof listPollWindows>>;
};

export const Route = createFileRoute("/admin/schedule")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoader(location.pathname);
    const cycles = await listElectionCycles();
    const withWindows = await Promise.all(
      cycles.map(async (cycle) => ({
        ...cycle,
        pollWindows: await listPollWindows(cycle.id),
      })),
    );
    return { cycles: withWindows, admin };
  },
  head: () => ({
    meta: [{ title: "Admin Schedule — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSchedulePage,
});

function AdminSchedulePage() {
  const { cycles: initialCycles, admin } = Route.useLoaderData();
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const isSuperadmin = admin.role === "superadmin";

  const setPhase = async (cycle: Cycle, phase: Phase) => {
    if (
      cycle.phase !== phase &&
      !window.confirm(
        `Change ${cycle.slug} from "${cycle.phase}" to "${phase}"? This is a significant election state transition.`,
      )
    ) {
      return;
    }
    setBusySlug(cycle.slug);
    try {
      await adminSetCyclePhaseFn({ data: { cycleSlug: cycle.slug, phase } });
      setCycles((rows) => rows.map((row) => (row.slug === cycle.slug ? { ...row, phase } : row)));
      toast.success(`Set ${cycle.slug} to ${phase}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set cycle phase");
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-3xl">
              <CalendarClock className="h-6 w-6 text-primary" /> Election cycles & poll windows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-xl">{cycle.name}</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {cycle.slug} · {cycle.phase}
                    </div>
                  </div>
                  {isSuperadmin ? (
                    <div className="flex flex-wrap gap-2">
                      {PHASES.map((phase) => (
                        <Button
                          key={phase}
                          size="sm"
                          variant={cycle.phase === phase ? "default" : "outline"}
                          className={cycle.phase === phase ? "bg-gradient-gold" : ""}
                          onClick={() => void setPhase(cycle, phase)}
                          disabled={busySlug === cycle.slug}
                        >
                          {busySlug === cycle.slug && cycle.phase !== phase ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          {phase}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      View only — contact a superadmin to change cycle phase.
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Region</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Opens</TableHead>
                        <TableHead>Closes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cycle.pollWindows.map((window) => (
                        <TableRow key={window.id}>
                          <TableCell>{window.region}</TableCell>
                          <TableCell>{window.poll_date}</TableCell>
                          <TableCell>{window.opens_at.slice(0, 5)}</TableCell>
                          <TableCell>{window.closes_at.slice(0, 5)}</TableCell>
                        </TableRow>
                      ))}
                      {cycle.pollWindows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground">
                            No poll windows configured for this cycle.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
            {cycles.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No election cycles configured.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
      <SiteFooter />
    </div>
  );
}
