import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { verifyCertificate } from "@/lib/api/verify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify/$certificateNumber")({
  loader: async ({ params }) => verifyCertificate(params.certificateNumber),
  head: ({ params }) => ({
    meta: [
      { title: `Verify Certificate ${params.certificateNumber} — MY-KDM` },
      {
        name: "description",
        content: "Public verification page for MY-KDM electronic candidate certificates.",
      },
    ],
  }),
  component: VerifyCertificatePage,
});

function VerifyCertificatePage() {
  const verification = Route.useLoaderData();
  const { certificateNumber } = Route.useParams();
  const ok = verification.valid;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Public certificate verification
        </div>
        <h1 className="mt-2 font-display text-4xl">
          <span className="text-ink">Certificate</span>{" "}
          <span className="text-gradient-gold">{certificateNumber}</span>
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
                  <CheckCircle2 className="h-5 w-5 text-sage" /> Valid certificate
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-flag-red" /> Invalid certificate
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {ok ? (
              <>
                <Detail label="Full name" value={verification.fullName ?? "—"} />
                <Detail label="Position" value={verification.positionTitle ?? "—"} />
                <Detail label="Scope" value={verification.scope ?? "—"} />
                <Detail label="County" value={verification.county ?? "—"} />
                <Detail
                  label="Issued at"
                  value={
                    verification.certifiedAt
                      ? new Date(verification.certifiedAt).toLocaleString()
                      : "—"
                  }
                />
                <Detail label="Status" value={verification.status ?? "approved"} />
              </>
            ) : (
              <p className="rounded-lg border border-flag-red/30 bg-flag-red/10 px-3 py-2 text-flag-red">
                No valid certificate was found for this certificate number.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-gold">
            <Link to="/candidates">
              <ShieldCheck className="mr-2 h-4 w-4" /> Browse candidates
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
