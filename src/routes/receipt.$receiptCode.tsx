import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ReceiptText, ShieldAlert, Vote } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { verifyReceipt } from "@/lib/api/verify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/receipt/$receiptCode")({
  loader: async ({ params }) => verifyReceipt(params.receiptCode),
  head: ({ params }) => ({
    meta: [
      { title: `Verify Receipt ${params.receiptCode} — MY-KDM` },
      { name: "description", content: "Public verification page for MY-KDM voting receipts." },
    ],
  }),
  component: VerifyReceiptPage,
});

function VerifyReceiptPage() {
  const verification = Route.useLoaderData();
  const { receiptCode } = Route.useParams();
  const ok = verification.valid;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Public receipt verification
        </div>
        <h1 className="mt-2 font-display text-4xl">
          <span className="text-ink">Receipt</span>{" "}
          <span className="text-gradient-gold">{receiptCode}</span>
        </h1>
        <Card
          className={`mt-6 border-2 ${
            ok ? "border-sage/40 bg-sage/5" : "border-flag-red/40 bg-flag-red/10"
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-2xl">
              {ok ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-sage" /> Valid receipt
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-flag-red" /> Invalid receipt
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {ok ? (
              <>
                <Detail label="Receipt code" value={verification.receiptCode ?? receiptCode} mono />
                <Detail label="Candidate" value={verification.candidateName ?? "—"} />
                <Detail label="Position" value={verification.positionTitle ?? "—"} />
                <Detail label="Scope" value={verification.positionScope ?? "—"} />
                <Detail
                  label="Cast at"
                  value={verification.castAt ? new Date(verification.castAt).toLocaleString() : "—"}
                />
              </>
            ) : (
              <p className="rounded-lg border border-flag-red/30 bg-flag-red/10 px-3 py-2 text-flag-red">
                No vote receipt was found for this code.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-gold">
            <Link to="/elections">
              <Vote className="mr-2 h-4 w-4" /> Open elections
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              <ReceiptText className="mr-2 h-4 w-4" /> Back home
            </Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}
