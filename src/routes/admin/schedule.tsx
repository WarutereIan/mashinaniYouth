import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  adminCreateCycleFn,
  adminCreatePollWindowFn,
  adminDeleteCycleFn,
  adminDeletePollWindowFn,
  adminSetCyclePhaseFn,
  adminUpdateCycleFn,
  adminUpdatePollWindowFn,
  listElectionCycles,
  listPollWindows,
  type ElectionCycleRow,
  type PollWindowRow,
} from "@/lib/api/admin";
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

const PHASES = ["draft", "scheduled", "open", "closed", "tallied", "cancelled"] as const;
type Phase = (typeof PHASES)[number];

type Cycle = ElectionCycleRow & { pollWindows: PollWindowRow[] };

// datetime-local yields "YYYY-MM-DDTHH:mm"; append seconds + EAT offset for Postgres timestamptz.
const toEatTz = (local: string) => (local ? `${local}:00+03:00` : local);
const toDatetimeLocal = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toDateLocal = (iso: string) => (iso ? iso.slice(0, 10) : "");

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
    return { cycles: withWindows as Cycle[], admin };
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

  const refreshCycle = async (slug: string) => {
    const all = await listElectionCycles();
    const withWindows = await Promise.all(
      all.map(async (c) => ({ ...c, pollWindows: await listPollWindows(c.id) })),
    );
    setCycles(withWindows as Cycle[]);
    void slug;
  };

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
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="flex items-center gap-2 font-display text-3xl">
              <CalendarClock className="h-6 w-6 text-primary" /> Election cycles & poll windows
            </CardTitle>
            {isSuperadmin && (
              <CycleDialogButton mode="create" onSaved={() => void refreshCycle("")} />
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {cycles.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                isSuperadmin={isSuperadmin}
                busySlug={busySlug}
                onPhase={setPhase}
                onChanged={() => void refreshCycle(cycle.slug)}
              />
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

function CycleCard({
  cycle,
  isSuperadmin,
  busySlug,
  onPhase,
  onChanged,
}: {
  cycle: Cycle;
  isSuperadmin: boolean;
  busySlug: string | null;
  onPhase: (c: Cycle, p: Phase) => void;
  onChanged: () => void;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-display text-xl">{cycle.name}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {cycle.slug} · {cycle.phase}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(cycle.window_start).toLocaleString()} →{" "}
            {new Date(cycle.window_end).toLocaleString()}
          </div>
        </div>
        {isSuperadmin ? (
          <div className="flex flex-wrap items-center gap-2">
            {PHASES.map((phase) => (
              <Button
                key={phase}
                size="sm"
                variant={cycle.phase === phase ? "default" : "outline"}
                className={cycle.phase === phase ? "bg-gradient-gold" : ""}
                onClick={() => void onPhase(cycle, phase)}
                disabled={busySlug === cycle.slug}
              >
                {busySlug === cycle.slug && cycle.phase !== phase ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {phase}
              </Button>
            ))}
            <CycleDialogButton mode="edit" cycle={cycle} onSaved={onChanged} onDelete={onChanged} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            View only — contact a superadmin to change cycle phase.
          </p>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Poll windows
          </div>
          {isSuperadmin && (
            <PollWindowDialogButton mode="create" cycleId={cycle.id} onSaved={onChanged} />
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Region</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Opens</TableHead>
              <TableHead>Closes</TableHead>
              <TableHead>Counties</TableHead>
              {isSuperadmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycle.pollWindows.map((pw) => (
              <TableRow key={pw.id}>
                <TableCell className="font-medium">{pw.region}</TableCell>
                <TableCell>{pw.poll_date}</TableCell>
                <TableCell>{new Date(pw.opens_at).toLocaleTimeString()}</TableCell>
                <TableCell>{new Date(pw.closes_at).toLocaleTimeString()}</TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                  {pw.counties.join(", ") || "—"}
                </TableCell>
                {isSuperadmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <PollWindowDialogButton
                        mode="edit"
                        cycleId={cycle.id}
                        window={pw}
                        onSaved={onChanged}
                      />
                      <DeletePollWindowButton pw={pw} region={pw.region} onDeleted={onChanged} />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {cycle.pollWindows.length === 0 && (
              <TableRow>
                <TableCell colSpan={isSuperadmin ? 6 : 5} className="text-muted-foreground">
                  No poll windows configured for this cycle.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------- Cycle dialog ---------- */

type CycleForm = {
  name: string;
  slug: string;
  windowStart: string;
  windowEnd: string;
  phase: Phase;
};

const emptyCycleForm: CycleForm = {
  name: "",
  slug: "",
  windowStart: "",
  windowEnd: "",
  phase: "draft",
};

function CycleDialogButton({
  mode,
  cycle,
  onSaved,
  onDelete,
}: {
  mode: "create" | "edit";
  cycle?: Cycle;
  onSaved: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CycleForm>(emptyCycleForm);
  const [busy, setBusy] = useState(false);

  const openDialog = () => {
    if (mode === "edit" && cycle) {
      setForm({
        name: cycle.name,
        slug: cycle.slug,
        windowStart: toDatetimeLocal(cycle.window_start),
        windowEnd: toDatetimeLocal(cycle.window_end),
        phase: cycle.phase,
      });
    } else {
      setForm(emptyCycleForm);
    }
    setOpen(true);
  };

  const submit = async () => {
    if (form.name.trim().length < 2) return toast.error("Cycle name is required");
    if (form.slug.trim().length < 2) return toast.error("Cycle slug is required");
    if (!form.windowStart || !form.windowEnd)
      return toast.error("Window start and end are required");
    if (new Date(form.windowEnd) <= new Date(form.windowStart))
      return toast.error("Window end must be after window start");
    setBusy(true);
    try {
      if (mode === "edit" && cycle) {
        await adminUpdateCycleFn({
          data: {
            id: cycle.id,
            name: form.name.trim(),
            slug: form.slug.trim(),
            windowStart: toEatTz(form.windowStart),
            windowEnd: toEatTz(form.windowEnd),
            phase: form.phase,
          },
        });
        toast.success(`Updated ${form.name}`);
      } else {
        await adminCreateCycleFn({
          data: {
            name: form.name.trim(),
            slug: form.slug.trim(),
            windowStart: toEatTz(form.windowStart),
            windowEnd: toEatTz(form.windowEnd),
            phase: form.phase,
          },
        });
        toast.success(`Created ${form.name}`);
      }
      setOpen(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!cycle || !onDelete) return;
    if (!window.confirm(`Delete cycle "${cycle.name}"? Poll windows will be removed too.`)) return;
    setBusy(true);
    try {
      await adminDeleteCycleFn({ data: { id: cycle.id } });
      toast.success(`Deleted ${cycle.name}`);
      setOpen(false);
      onDelete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" variant={mode === "create" ? "default" : "outline"} onClick={openDialog}>
        {mode === "create" ? (
          <>
            <Plus className="mr-2 h-4 w-4" /> New cycle
          </>
        ) : (
          <>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit cycle" : "Create election cycle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-name">Name</Label>
              <Input
                id="cycle-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="2026 MY-KDM General Elections"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-slug">Slug</Label>
              <Input
                id="cycle-slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="mykdm-2026"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers and dashes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cycle-start">Window start</Label>
                <Input
                  id="cycle-start"
                  type="datetime-local"
                  value={form.windowStart}
                  onChange={(e) => setForm((f) => ({ ...f, windowStart: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle-end">Window end</Label>
                <Input
                  id="cycle-end"
                  type="datetime-local"
                  value={form.windowEnd}
                  onChange={(e) => setForm((f) => ({ ...f, windowEnd: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phase</Label>
              <Select
                value={form.phase}
                onValueChange={(v) => setForm((f) => ({ ...f, phase: v as Phase }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            {mode === "edit" && (
              <Button
                variant="outline"
                className="border-flag-red/40 text-flag-red hover:bg-flag-red/10"
                onClick={() => void remove()}
                disabled={busy}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            )}
            <Button onClick={() => void submit()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "edit" ? "Save changes" : "Create cycle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------- Poll window dialog ---------- */

type PollForm = {
  region: string;
  pollDate: string;
  opensAt: string;
  closesAt: string;
  counties: string;
};

function PollWindowDialogButton({
  mode,
  cycleId,
  window,
  onSaved,
}: {
  mode: "create" | "edit";
  cycleId: number;
  window?: PollWindowRow;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PollForm>({
    region: "",
    pollDate: "",
    opensAt: "",
    closesAt: "",
    counties: "",
  });
  const [busy, setBusy] = useState(false);

  const openDialog = () => {
    if (mode === "edit" && window) {
      setForm({
        region: window.region,
        pollDate: toDateLocal(window.poll_date),
        opensAt: toDatetimeLocal(window.opens_at),
        closesAt: toDatetimeLocal(window.closes_at),
        counties: window.counties.join(", "),
      });
    } else {
      setForm({ region: "", pollDate: "", opensAt: "", closesAt: "", counties: "" });
    }
    setOpen(true);
  };

  const countiesArray = useMemo(
    () =>
      form.counties
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    [form.counties],
  );

  const submit = async () => {
    if (form.region.trim().length < 2) return toast.error("Region is required");
    if (!form.pollDate) return toast.error("Poll date is required");
    if (!form.opensAt || !form.closesAt) return toast.error("Opens and closes times are required");
    if (new Date(form.closesAt) <= new Date(form.opensAt))
      return toast.error("Closes must be after opens");
    setBusy(true);
    try {
      if (mode === "edit" && window) {
        await adminUpdatePollWindowFn({
          data: {
            id: window.id,
            cycleId,
            region: form.region.trim(),
            pollDate: form.pollDate,
            opensAt: toEatTz(form.opensAt),
            closesAt: toEatTz(form.closesAt),
            counties: countiesArray,
          },
        });
        toast.success(`Updated ${form.region}`);
      } else {
        await adminCreatePollWindowFn({
          data: {
            cycleId,
            region: form.region.trim(),
            pollDate: form.pollDate,
            opensAt: toEatTz(form.opensAt),
            closesAt: toEatTz(form.closesAt),
            counties: countiesArray,
          },
        });
        toast.success(`Added ${form.region} window`);
      }
      setOpen(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" variant={mode === "create" ? "outline" : "ghost"} onClick={openDialog}>
        {mode === "create" ? (
          <>
            <Plus className="mr-2 h-4 w-4" /> Add window
          </>
        ) : (
          <>
            <Pencil className="h-3.5 w-3.5" />
          </>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit poll window" : "Add poll window"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw-region">Region</Label>
              <Input
                id="pw-region"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="Nairobi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw-date">Poll date</Label>
              <Input
                id="pw-date"
                type="date"
                value={form.pollDate}
                onChange={(e) => setForm((f) => ({ ...f, pollDate: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pw-opens">Opens at</Label>
                <Input
                  id="pw-opens"
                  type="datetime-local"
                  value={form.opensAt}
                  onChange={(e) => setForm((f) => ({ ...f, opensAt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-closes">Closes at</Label>
                <Input
                  id="pw-closes"
                  type="datetime-local"
                  value={form.closesAt}
                  onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw-counties">Counties</Label>
              <Input
                id="pw-counties"
                value={form.counties}
                onChange={(e) => setForm((f) => ({ ...f, counties: e.target.value }))}
                placeholder="Nairobi, Kiambu, Kisumu"
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of counties.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void submit()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "edit" ? "Save changes" : "Add window"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeletePollWindowButton({
  pw,
  region,
  onDeleted,
}: {
  pw: PollWindowRow;
  region: string;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!window.confirm(`Delete poll window for "${region}"?`)) return;
    setBusy(true);
    try {
      await adminDeletePollWindowFn({ data: { id: pw.id } });
      toast.success(`Deleted ${region} window`);
      onDeleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      size="sm"
      variant="ghost"
      className="border-flag-red/40 text-flag-red hover:bg-flag-red/10"
      onClick={() => void remove()}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  );
}
