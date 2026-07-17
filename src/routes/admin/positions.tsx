import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Landmark, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  adminCreatePositionFn,
  adminDeletePositionFn,
  adminSetPositionApplicationsOpenFn,
  adminUpdatePositionFn,
  listPollWindows,
  listElectionCycles,
} from "@/lib/api/admin";
import { adminRouteLoader } from "@/lib/admin-loader";
import { listPositions } from "@/lib/api/positions";
import {
  COUNTY_NAMES,
  constituenciesForCounty,
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

type PollWindow = { id: number; region: string; poll_date: string };

type FormState = {
  title: string;
  tier: Tier;
  scope: string;
  description: string;
  county: string;
  constituency: string;
  ward: string;
  pollWindowId: string;
};

const emptyForm = (tier: Tier = "county"): FormState => ({
  title: "",
  tier,
  scope: SCOPE_BY_TIER[tier],
  description: "",
  county: "",
  constituency: "",
  ward: "",
  pollWindowId: "",
});

export const Route = createFileRoute("/admin/positions")({
  ssr: false,
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoader(location.pathname);
    const positions = await listPositions({ cycleSlug: "mykdm-2026" });
    const cycles = await listElectionCycles();
    const cycle = cycles.find((c) => c.slug === "mykdm-2026");
    const pollWindows: PollWindow[] = cycle
      ? ((await listPollWindows(cycle.id)) as PollWindow[])
      : [];
    return { admin, positions, pollWindows };
  },
  head: () => ({
    meta: [{ title: "Admin — Positions — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPositionsPage,
});

function AdminPositionsPage() {
  const { admin, positions: initialPositions, pollWindows } = Route.useLoaderData();
  const [positions, setPositions] = useState(initialPositions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterWindowId, setFilterWindowId] = useState<string>("all");

  const isSuperadmin = admin.role === "superadmin";

  const filteredPositions = useMemo(() => {
    if (filterWindowId === "all") return positions;
    if (filterWindowId === "unassigned") return positions.filter((p) => !p.pollWindowId);
    const id = Number(filterWindowId);
    return positions.filter((p) => p.pollWindowId === id);
  }, [positions, filterWindowId]);

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
      pollWindowId: position.pollWindowId ? String(position.pollWindowId) : "",
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
      if (!form.county) next.location = "County is required for this tier";
      else if (
        (form.tier === "constituency" || form.tier === "ward") &&
        !form.constituency
      )
        next.location = "Constituency is required for this tier";
      else if (form.tier === "ward" && !form.ward)
        next.location = "Ward is required for ward-tier positions";
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
        constituency: form.tier === "national" ? undefined : form.constituency || undefined,
        ward: form.tier === "national" ? undefined : form.ward || undefined,
        pollWindowId: form.pollWindowId ? Number(form.pollWindowId) : null,
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

  const toggleApplications = async (position: Position, next: boolean) => {
    setTogglingId(position.id);
    try {
      await adminSetPositionApplicationsOpenFn({
        data: { positionId: position.id, open: next },
      });
      setPositions((rows) =>
        rows.map((p) => (p.id === position.id ? { ...p, applicationsOpen: next } : p)),
      );
      toast.success(`${next ? "Opened" : "Closed"} nominations for ${position.title}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setTogglingId(null);
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
            ? "Create, edit, or delete positions, and open/close candidate nominations per seat."
            : "View only — contact a superadmin to make changes."}
        </p>

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">All positions</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Filter by schedule:
              </Label>
              <Select value={filterWindowId} onValueChange={setFilterWindowId}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All windows</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {pollWindows.map((pw) => (
                    <SelectItem key={pw.id} value={String(pw.id)}>
                      {pw.region} — {pw.poll_date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Nominations</TableHead>
                  {isSuperadmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="uppercase">{p.tier}</TableCell>
                    <TableCell>{p.scope}</TableCell>
                    <TableCell>
                      {[p.county, p.constituency, p.ward].filter(Boolean).join(" › ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {(() => {
                        const pw = pollWindows.find((w) => w.id === p.pollWindowId);
                        return pw ? `${pw.region} (${pw.poll_date})` : "—";
                      })()}
                    </TableCell>
                    <TableCell>
                      {isSuperadmin ? (
                        <Button
                          size="sm"
                          variant={p.applicationsOpen ? "default" : "outline"}
                          className={p.applicationsOpen ? "bg-gradient-gold" : ""}
                          disabled={togglingId === p.id}
                          onClick={() => void toggleApplications(p, !p.applicationsOpen)}
                        >
                          {togglingId === p.id ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          {p.applicationsOpen ? "Open" : "Closed"}
                        </Button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            p.applicationsOpen ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.applicationsOpen ? "bg-primary" : "bg-muted-foreground/40"
                            }`}
                          />
                          {p.applicationsOpen ? "Open" : "Closed"}
                        </span>
                      )}
                    </TableCell>
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
                {filteredPositions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isSuperadmin ? 7 : 6}
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
                <>
                  <div className="space-y-2">
                    <Label>County *</Label>
                    <Select
                      value={form.county}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, county: v, constituency: "", ward: "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {COUNTY_NAMES.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Constituency{" "}
                      {(form.tier === "constituency" || form.tier === "ward") && "*"}
                    </Label>
                    <Select
                      value={form.constituency}
                      onValueChange={(v) => setForm((f) => ({ ...f, constituency: v, ward: "" }))}
                      disabled={!form.county}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={form.county ? "Select constituency" : "Select county first"}
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {constituencyOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ward {form.tier === "ward" && "*"}</Label>
                    <Select
                      value={form.ward}
                      onValueChange={(v) => setForm((f) => ({ ...f, ward: v }))}
                      disabled={!form.constituency}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            form.constituency ? "Select ward" : "Select constituency first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {wardOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {errors.location && <p className="text-xs text-flag-red">{errors.location}</p>}
              <div className="space-y-2">
                <Label>Voting schedule (poll window)</Label>
                <Select
                  value={form.pollWindowId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, pollWindowId: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (unassigned)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (unassigned)</SelectItem>
                    {pollWindows.map((pw) => (
                      <SelectItem key={pw.id} value={String(pw.id)}>
                        {pw.region} — {pw.poll_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assign this position to a specific voting window/date.
                </p>
              </div>
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
