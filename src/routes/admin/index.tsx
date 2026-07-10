import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, Users, Vote, FileClock, HeartHandshake, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { adminDashboardStats } from "@/lib/api/admin";
import { adminRouteLoader } from "@/lib/admin-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoader(location.pathname);
    const stats = await adminDashboardStats();
    return { admin, stats };
  },
  head: () => ({
    meta: [{ title: "Admin Dashboard — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { admin, stats } = Route.useLoaderData();
  useEffect(() => {
    if (stats.hasErrors) {
      toast.error("Some dashboard stats failed to load — values shown may be incomplete.");
    }
  }, [stats.hasErrors]);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <div className="text-xs uppercase tracking-widest text-primary">Admin control center</div>
          <h1 className="mt-2 font-display text-4xl">
            <span className="text-ink">MY-KDM</span>{" "}
            <span className="text-gradient-gold">Operations</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{admin.role}</span>.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AdminStat
            icon={Users}
            label="Registered voters"
            value={stats.registeredVoters.toLocaleString()}
          />
          <AdminStat
            icon={FileClock}
            label="Pending candidates"
            value={stats.pendingCandidates.toLocaleString()}
          />
          <AdminStat icon={Vote} label="Votes cast" value={stats.votesCast.toLocaleString()} />
          <AdminStat
            icon={HeartHandshake}
            label="Open pledges"
            value={stats.openPledges.toLocaleString()}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <QuickLink
            to="/admin/candidates"
            title="Candidate approvals"
            body="Review and approve or reject pending candidate submissions."
          />
          <QuickLink
            to="/admin/positions"
            title="Ballot positions"
            body="Review seats in the 2026 cycle and their geographic scope."
          />
          <QuickLink
            to="/admin/schedule"
            title="Election schedule"
            body="Review cycles and poll windows, then advance cycle phases."
          />
          <QuickLink
            to="/admin/support"
            title="Support pledges"
            body="Track donation and partnership intents from supporters."
          />
          <QuickLink
            to="/admin/audit"
            title="Audit & reconciliation"
            body="Recount tallies, review audit log entries, and manage cycle seals."
          />
          {admin.role === "superadmin" && (
            <QuickLink
              to="/admin/users"
              title="Admin users"
              body="Grant or revoke superadmin, reviewer, and viewer roles."
            />
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function AdminStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Icon className="h-3.5 w-3.5 text-primary" /> {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  to,
  title,
  body,
}: {
  to:
    | "/admin/candidates"
    | "/admin/positions"
    | "/admin/schedule"
    | "/admin/support"
    | "/admin/audit"
    | "/admin/users";
  title: string;
  body: string;
}) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{body}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to={to}>
            Open <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
