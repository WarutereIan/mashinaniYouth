import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { FaFacebook, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { signOutVoter, useVoter } from "@/lib/voters-source";
import logoAsset from "@/assets/mykdm-logo.asset.json";
import { MTAJI_BASE } from "@/lib/mtaji";
import { SupportButton } from "@/components/support-button";
export { SUPPORT_URL } from "@/lib/support";

const nav = [
  { to: "/", label: "Home" },
  { to: "/elections", label: "Elections" },
  { to: "/candidates", label: "Candidates" },
  { to: "/about", label: "About MY-KDM" },
];

const externalNav = [{ href: `${MTAJI_BASE}/shop/mykdm`, label: "Merchandise" }];

export const MYKDM_SOCIALS = [
  {
    Icon: FaFacebook,
    label: "Facebook",
    href: "https://facebook.com/mashinaniyouthmovement",
    color: "#1877F2",
  },
  { Icon: FaXTwitter, label: "X (Twitter)", href: "https://x.com/mymkenya", color: "#000000" },
  {
    Icon: FaInstagram,
    label: "Instagram",
    href: "https://instagram.com/mashinaniyouthmovement",
    color: "#E4405F",
  },
  {
    Icon: FaYoutube,
    label: "YouTube",
    href: "https://youtube.com/@mashinaniyouthmovement",
    color: "#FF0000",
  },
];

export function SiteHeader() {
  const { voter } = useVoter();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    await signOutVoter();
    window.dispatchEvent(new Event("mym:voter-changed"));
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logoAsset.url}
            alt="MY-KDM logo"
            className="h-11 w-11 rounded-lg object-cover shadow-sm ring-1 ring-border"
          />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold tracking-tight">MY-KDM</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
              Mashinani Youth Kazi Delivery Movement
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
          {externalNav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <SupportButton
            variant="outline"
            size="sm"
            className="border-flag-red/40 text-flag-red hover:bg-flag-red/10 hover:text-flag-red"
          />

          {voter ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 transition hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                  {voter.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-sm font-medium">{voter.name.split(" ")[0]}</span>
              </Link>

              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth" search={{ redirect: undefined }}>
                  Log in
                </Link>
              </Button>
              <Button size="sm" className="bg-gradient-gold" asChild>
                <Link to="/auth" search={{ redirect: undefined }}>
                  Sign up
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-md border border-border p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
            {externalNav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
            <div className="mt-1" onClick={() => setOpen(false)}>
              <SupportButton
                variant="outline"
                size="sm"
                className="w-full border-flag-red/40 text-flag-red hover:bg-flag-red/10 hover:text-flag-red"
              />
            </div>
            <div className="mt-2 flex gap-2">
              {voter ? (
                <Button variant="outline" size="sm" onClick={logout} className="flex-1">
                  <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out ({voter.name.split(" ")[0]})
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link
                      to="/auth"
                      search={{ redirect: undefined }}
                      onClick={() => setOpen(false)}
                    >
                      Log in
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="flex-1 bg-gradient-gold">
                    <Link
                      to="/auth"
                      search={{ redirect: undefined }}
                      onClick={() => setOpen(false)}
                    >
                      Sign up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src={logoAsset.url}
              alt="MY-KDM logo"
              className="h-11 w-11 rounded-lg object-cover ring-1 ring-white/15"
            />
            <div className="leading-tight">
              <div className="font-display text-lg">Mashinani Youth Kazi Delivery Movement</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                Kutoka Ground Hadi Top
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            An elected, digitally-powered youth leadership structure — built from the ward level
            upward and powered by M-Taji.
          </p>
        </div>
        <div className="text-sm">
          <div className="mb-3 text-xs uppercase tracking-widest text-white/50">Ballot</div>
          <ul className="space-y-2">
            <li>
              <Link to="/elections" className="text-white/80 hover:text-accent">
                Live elections
              </Link>
            </li>
            <li>
              <Link
                to="/auth"
                search={{ redirect: undefined }}
                className="text-white/80 hover:text-accent"
              >
                Sign up / Log in
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="mb-3 text-xs uppercase tracking-widest text-white/50">Movement</div>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="text-white/80 hover:text-accent">
                About MY-KDM
              </Link>
            </li>
            <li>
              <SupportButton variant="link" className="h-auto p-0 text-flag-red hover:text-accent">
                Support MY-KDM
              </SupportButton>
            </li>
            <li>
              <span className="text-white/60">Powered by M-Taji</span>
            </li>
            <li>
              <span className="text-white/60">In partnership with USLA</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/50 sm:px-6">
          © {new Date().getFullYear()} Mashinani Youth Kazi Delivery Movement. Electronic voting
          powered by M-Taji.
        </div>
      </div>
    </footer>
  );
}
