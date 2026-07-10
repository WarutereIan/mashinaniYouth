import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/not-authorized")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Not authorized — MY-KDM" }, { name: "robots", content: "noindex" }],
  }),
  component: NotAuthorizedPage,
});

function NotAuthorizedPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <ShieldX className="mx-auto h-12 w-12 text-flag-red" />
        <h1 className="mt-4 font-display text-3xl">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are signed in, but your account does not have admin access. Contact a superadmin if
          you believe this is an error.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </section>
      <SiteFooter />
    </div>
  );
}
