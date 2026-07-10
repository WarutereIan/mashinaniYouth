import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HeartHandshake, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { adminSetPledgeStatusFn, listSupportPledges } from "@/lib/api/admin";
import { adminRouteLoader } from "@/lib/admin-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Pledge = Awaited<ReturnType<typeof listSupportPledges>>[number];
type PledgeStatus = Pledge["status"];

const STATUSES: PledgeStatus[] = ["pledged", "fulfilled", "cancelled"];

export const Route = createFileRoute("/admin/support")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoader(location.pathname);
    const pledges = await listSupportPledges();
    return { pledges, admin };
  },
  head: () => ({
    meta: [{ title: "Admin Support Pledges — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const { pledges: initialPledges, admin } = Route.useLoaderData();
  const [pledges, setPledges] = useState(initialPledges);
  const [busyId, setBusyId] = useState<string | null>(null);
  const canAct = admin.role !== "viewer";

  const setStatus = async (pledge: Pledge, status: PledgeStatus) => {
    if (pledge.status === status) return;
    const previous = pledge.status;
    setPledges((rows) => rows.map((row) => (row.id === pledge.id ? { ...row, status } : row)));
    setBusyId(pledge.id);
    try {
      await adminSetPledgeStatusFn({ data: { pledgeId: pledge.id, status } });
      toast.success(`Updated ${pledge.full_name} to ${status}`);
    } catch (error) {
      setPledges((rows) =>
        rows.map((row) => (row.id === pledge.id ? { ...row, status: previous } : row)),
      );
      toast.error(error instanceof Error ? error.message : "Failed to update status");
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
            <CardTitle className="flex items-center gap-2 font-display text-3xl">
              <HeartHandshake className="h-6 w-6 text-primary" /> Support pledges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supporter</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Amount (KES)</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pledges.map((pledge) => (
                  <TableRow key={pledge.id}>
                    <TableCell className="font-medium">{pledge.full_name}</TableCell>
                    <TableCell className="uppercase">{pledge.kind}</TableCell>
                    <TableCell>{pledge.amount_kes?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell>{pledge.phone ?? "—"}</TableCell>
                    <TableCell>{pledge.email ?? "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={pledge.status}
                        onValueChange={(value) => void setStatus(pledge, value as PledgeStatus)}
                        disabled={busyId === pledge.id || !canAct}
                      >
                        <SelectTrigger className="w-[140px]">
                          {busyId === pledge.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {pledges.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No pledges yet.
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
