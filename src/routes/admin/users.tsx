import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  adminGrantRoleFn,
  adminListUsers,
  adminLookupUserByEmailFn,
  adminRevokeRoleFn,
  type AdminListedUser,
  type AdminRole,
} from "@/lib/api/admin";
import { superadminRouteLoader } from "@/lib/admin-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ROLES: AdminRole[] = ["superadmin", "reviewer", "viewer"];

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await superadminRouteLoader(location.pathname);
    const users = await adminListUsers();
    return { admin, users };
  },
  head: () => ({
    meta: [{ title: "Admin Users — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { admin, users: initialUsers } = Route.useLoaderData();
  const [users, setUsers] = useState(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [lookupUserId, setLookupUserId] = useState<string | null>(null);
  const [lookupEmail, setLookupEmail] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole>("viewer");
  const [busy, setBusy] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const superadminCount = users.filter((u) => u.role === "superadmin").length;

  const resetDialog = () => {
    setEmail("");
    setLookupUserId(null);
    setLookupEmail(null);
    setRole("viewer");
  };

  const lookupUser = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      const result = await adminLookupUserByEmailFn({ data: { email: email.trim() } });
      if (!result) {
        toast.error("No user found with that email");
        setLookupUserId(null);
        setLookupEmail(null);
        return;
      }
      setLookupUserId(result.user_id);
      setLookupEmail(result.email);
      toast.success(`Found ${result.email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  };

  const grantRole = async () => {
    if (!lookupUserId) return;
    setBusy(true);
    try {
      await adminGrantRoleFn({ data: { userId: lookupUserId, role } });
      const next: AdminListedUser = {
        user_id: lookupUserId,
        email: lookupEmail ?? email,
        role,
      };
      setUsers((rows) => {
        const existing = rows.findIndex((r) => r.user_id === lookupUserId);
        if (existing >= 0) {
          const copy = [...rows];
          copy[existing] = next;
          return copy;
        }
        return [...rows, next].sort((a, b) => a.email.localeCompare(b.email));
      });
      toast.success(`Granted ${role} to ${lookupEmail ?? email}`);
      setDialogOpen(false);
      resetDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to grant role");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (user: AdminListedUser) => {
    if (user.user_id === admin.userId) {
      toast.error("You cannot revoke your own admin role");
      return;
    }
    if (user.role === "superadmin" && superadminCount <= 1) {
      toast.error("Cannot revoke the last superadmin — promote another user first");
      return;
    }
    if (!window.confirm(`Revoke admin access for ${user.email}?`)) return;
    setBusyUserId(user.user_id);
    try {
      await adminRevokeRoleFn({ data: { userId: user.user_id } });
      setUsers((rows) => rows.filter((r) => r.user_id !== user.user_id));
      toast.success(`Revoked access for ${user.email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke role");
    } finally {
      setBusyUserId(null);
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
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="font-display text-3xl">Admin users</CardTitle>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetDialog();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" /> Add admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Grant admin role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">User email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void lookupUser()}
                        disabled={busy || !email.trim()}
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up"}
                      </Button>
                    </div>
                    {lookupUserId && (
                      <p className="text-xs text-muted-foreground">
                        User ID: <code>{lookupUserId}</code>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => void grantRole()} disabled={busy || !lookupUserId}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Grant role
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell className="uppercase">{user.role}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-flag-red/40 text-flag-red hover:bg-flag-red/10"
                        onClick={() => void revoke(user)}
                        disabled={
                          busyUserId === user.user_id ||
                          user.user_id === admin.userId ||
                          (user.role === "superadmin" && superadminCount <= 1)
                        }
                      >
                        {busyUserId === user.user_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                        )}
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      No admin users configured.
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
