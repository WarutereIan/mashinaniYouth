import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Landmark, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  adminCreatePositionFn,
  adminDeletePositionFn,
  adminUpdatePositionFn,
} from "@/lib/api/admin";
import { adminRouteLoader } from "@/lib/admin-loader";
import { listPositions } from "@/lib/api/positions";
import {
  COUNTY_NAMES,
  constituenciesForCounty,
  validateLocationForTier,
  wardsForConstituency,
} from "@/lib/locations";
import type { Position, Tier } from "@/lib/tier-meta";
import { TIER_META } from "@/lib/tier-meta";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const TIERS: Tier[] = ["national", "county", "constituency", "ward"];
const SCOPE_BY_TIER: Record<Tier, string> = {
  national: "National Secretariat",
  county: "County Leadership",
  constituency: "Constituency Leadership",
  ward: "Ward Leadership",
};

type FormState = {
  title: string;
  tier: Tier;
  scope: string;
  description: string;
  county: string;
  constituency: string;
  ward: string;
};

const emptyForm = (tier: Tier = "county"): FormState => ({
  title: "",
  tier,
  scope: SCOPE_BY_TIER[tier],
  description: "",
  county: "",
  constituency: "",
  ward: "",
});

export const Route = createFileRoute("/admin/positions")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoader(location.pathname);
    const positions = await listPositions({ cycleSlug: "mykdm-2026" });
    return { admin, positions };
  },
  head: () => ({
    meta: [{ title: "Admin — Positions — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPositionsPage,
});

function AdminPositionsPage() {
  const { admin, positions: initialPositions } = Route.useLoaderData();
  const [positions, setPositions] = useState(initialPositions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isSuperadmin = admin.role === "superadmin";

  const constituencyOptions = useMemo(() => constituenciesForCounty(form.county), [form.county]);
  const wardOptions = useMemo(() => wardsForConstituency(form.constituency), [form.constituency]);

  useEffect(() => {
    const handler = () => {
      listPositions({ cycleSlug: "mykdm-2026" })
        .then(setPositions)
        .catch(() => undefined);
    };
    window.addEventListener("mym:positions-changed", handler);
    return () => window.removeEventListener("mym:positions-changed", handler);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (position: Position) => {
    setEditing(position);
    setForm({
      title: position.title,
      tier: position.tier,
      scope: position.scope,
      description: position.description,
      county: position.county ?? "",
      constituency: position.constituency ?? "",
      ward: position.ward ?? "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const updateTier = (tier: Tier) => {
    setForm((f) => ({
      ...f,
      tier,
      scope: SCOPE_BY_TIER[tier],
      county: tier === "national" ? "" : f.county,
      constituency: tier === "national" || tier === "county" ? "" : f.constituency,
      ward: tier !== "ward" ? "" : f.ward,
    }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 2) next.title = "Title is required";
    if (form.scope.trim().length < 2) next.scope = "Scope is required";
    if (form.tier !== "national") {
      const locationError = validateLocationForTier(
        form.tier,
        form.county,
        form.constituency || undefined,
        form.ward || undefined,
      );
      if (locationError) next.location = locationError;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        tier: form.tier,
        scope: form.scope.trim(),
        description: form.description.trim() || form.title.trim(),
        county: form.tier === "national" ? undefined : form.county || undefined,
        constituency:
          form.tier === "national" || form.tier === "county"
            ? undefined
            : form.constituency || undefined,
        ward: form.tier === "ward" ? form.ward || undefined : undefined,
        cycleSlug: "mykdm-2026",
      };

      if (editing) {
        await adminUpdatePositionFn({ data: { id: editing.id, ...payload } });
        toast.success(`Updated ${form.title}`);
      } else {
        await adminCreatePositionFn({ data: payload });
        toast.success(`Created ${form.title}`);
      }

      const refreshed = await listPositions({ cycleSlug: "mykdm-2026" });
      setPositions(refreshed);
      window.dispatchEvent(new Event("mym:positions-changed"));
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (position: Position) => {
    if (!window.confirm(`Delete position "${position.title}"?`)) return;
    setBusyId(position.id);
    try {
      await adminDeletePositionFn({ data: { id: position.id } });
      setPositions((rows) => rows.filter((p) => p.id !== position.id));
      window.dispatchEvent(new Event("mym:positions-changed"));
      toast.success(`Deleted ${position.title}`);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <h1 className="font-display text-3xl">Ballot positions</h1>
          </div>
          {isSuperadmin && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add position
            </Button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage seats in the 2026 cycle.{" "}
          {isSuperadmin
            ? "Create, edit, or delete positions."
            : "View only — contact a superadmin to make changes."}
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">All positions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Location</TableHead>
                  {isSuperadmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="uppercase">{p.tier}</TableCell>
                    <TableCell>{p.scope}</TableCell>
                    <TableCell>{p.ward ?? p.constituency ?? p.county ?? "—"}</TableCell>
                    {isSuperadmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-flag-red/40 text-flag-red hover:bg-flag-red/10"
                            onClick={() => void remove(p)}
                            disabled={busyId === p.id}
                          >
                            {busyId === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {positions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isSuperadmin ? 5 : 4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No positions configured.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit position" : "Create position"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pos-title">Title</Label>
                <Input
                  id="pos-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                {errors.title && <p className="text-xs text-flag-red">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={(v) => updateTier(v as Tier)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {TIER_META[tier].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pos-scope">Scope</Label>
                <Input
                  id="pos-scope"
                  value={form.scope}
                  onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                />
                {errors.scope && <p className="text-xs text-flag-red">{errors.scope}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pos-desc">Description</Label>
                <Textarea
                  id="pos-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              {form.tier !== "national" && (
                <div className="space-y-2">
                  <Label>County</Label>
                  <Select
                    value={form.county}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, county: v, constituency: "", ward: "" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTY_NAMES.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(form.tier === "constituency" || form.tier === "ward") && (
                <div className="space-y-2">
                  <Label>Constituency</Label>
                  <Select
                    value={form.constituency}
                    onValueChange={(v) => setForm((f) => ({ ...f, constituency: v, ward: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select constituency" />
                    </SelectTrigger>
                    <SelectContent>
                      {constituencyOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.tier === "ward" && (
                <div className="space-y-2">
                  <Label>Ward</Label>
                  <Select
                    value={form.ward}
                    onValueChange={(v) => setForm((f) => ({ ...f, ward: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wardOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {errors.location && <p className="text-xs text-flag-red">{errors.location}</p>}
            </div>
            <DialogFooter>
              <Button onClick={() => void save()} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? "Save changes" : "Create position"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
      <SiteFooter />
    </div>
  );
}
