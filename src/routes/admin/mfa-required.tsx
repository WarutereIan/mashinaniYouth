import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AdminMfaEnroll } from "@/components/admin-mfa-enroll";
import { adminRouteLoaderSkipMfa } from "@/lib/admin-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/mfa-required")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/admin",
  }),
  loader: async ({ location }) => {
    const { admin } = await adminRouteLoaderSkipMfa(location.pathname);
    return { admin };
  },
  head: () => ({
    meta: [{ title: "Admin MFA Required — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminMfaRequiredPage,
});

function AdminMfaRequiredPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-2xl">
              <ShieldAlert className="h-6 w-6 text-primary" /> Two-factor authentication required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Admin access requires a verified TOTP authenticator. Enroll below to continue to the
              admin console.
            </p>
            <AdminMfaEnroll
              onEnrolled={() => {
                navigate({ to: redirect ?? "/admin" });
              }}
            />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      <SiteFooter />
    </div>
  );
}
