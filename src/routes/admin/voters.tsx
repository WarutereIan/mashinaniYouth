import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Search, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  adminDeleteUserFn,
  adminDeleteVoterFn,
  adminListVoters,
  type AdminListedVoter,
} from "@/lib/api/admin";
import { adminRouteLoader } from "@/lib/admin-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/voters")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoader(location.pathname);
    const voters = await adminListVoters();
    return { admin, voters };
  },
  head: () => ({
    meta: [{ title: "Admin Voters — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminVotersPage,
});

function AdminVotersPage() {
  const { admin, voters: initialVoters } = Route.useLoaderData();
  const [voters, setVoters] = useState(initialVoters);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const canDelete = admin.role === "superadmin";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return voters;
    return voters.filter((v) => {
      const haystack = [
        v.full_name,
        v.email,
        v.phone,
        v.county,
        v.constituency,
        v.ward,
        v.national_id_last4,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [voters, search]);

  const removeVoterRoll = async (voter: AdminListedVoter) => {
    if (
      !window.confirm(
        `Remove "${voter.full_name}" from the voter roll?\n\nTheir votes will be deleted. The auth account will remain (use Delete account to remove it fully).`,
      )
    ) {
      return;
    }
    setBusyId(voter.id);
    try {
      await adminDeleteVoterFn({ data: { voterId: voter.id } });
      setVoters((rows) => rows.filter((row) => row.id !== voter.id));
      toast.success(`Removed ${voter.full_name} from the voter roll`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const deleteAccount = async (voter: AdminListedVoter) => {
    if (voter.user_id === admin.userId) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (
      !window.confirm(
        `Permanently delete the account for "${voter.full_name}" (${voter.email ?? "no email"})?\n\nThis removes the auth user, voter roll entry, candidacies, and related votes.`,
      )
    ) {
      return;
    }
    setBusyId(voter.id);
    try {
      await adminDeleteUserFn({ data: { userId: voter.user_id } });
      setVoters((rows) => rows.filter((row) => row.id !== voter.id));
      toast.success(`Deleted account for ${voter.full_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
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
            <CardTitle className="font-display text-3xl">Voters & accounts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage registered voters. Superadmins can remove roll entries or delete full auth
              accounts.
            </p>
            <div className="relative mt-4 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, location…"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Votes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell>
                      <div className="font-medium">{voter.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        ID •••{voter.national_id_last4}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{voter.email ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{voter.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {voter.ward}, {voter.constituency}, {voter.county}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{voter.vote_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canDelete || busyId === voter.id}
                          onClick={() => void removeVoterRoll(voter)}
                          title="Remove from voter roll only"
                        >
                          {busyId === voter.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserX className="mr-1 h-3.5 w-3.5" />
                          )}
                          Roll
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-flag-red/40 text-flag-red hover:bg-flag-red/10"
                          disabled={
                            !canDelete ||
                            busyId === voter.id ||
                            voter.user_id === admin.userId
                          }
                          onClick={() => void deleteAccount(voter)}
                          title="Delete full auth account"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Account
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {voters.length === 0 ? "No registered voters yet." : "No voters match your search."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {!canDelete && (
              <p className="mt-4 text-xs text-muted-foreground">
                Only superadmins can delete voters or accounts. You can still browse this list.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
      <SiteFooter />
    </div>
  );
}
