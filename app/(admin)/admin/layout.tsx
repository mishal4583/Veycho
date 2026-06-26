"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRoles } from "@/hooks/useRole";
import { LayoutDashboard, FileText, UtensilsCrossed, Tag, Sparkles, BookOpen, Image as ImageIcon, BadgePercent, Star, Brain, BarChart3, Settings, Users, LogOut, Loader2, ShieldAlert, MapPin } from "lucide-react";
import { toast } from "sonner";
import AdminCursorOff from "@/components/AdminCursorOff";

type NavRole = "super" | "manager" | "editor";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, role: "editor" as const },
  { to: "/admin/content", label: "Site Content", icon: FileText, role: "editor" as const },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed, role: "manager" as const },
  { to: "/admin/categories", label: "Categories", icon: Tag, role: "manager" as const },
  { to: "/admin/specials", label: "Chef Specials", icon: Sparkles, role: "manager" as const },
  { to: "/admin/story", label: "Story", icon: BookOpen, role: "editor" as const },
  { to: "/admin/gallery", label: "Gallery", icon: ImageIcon, role: "manager" as const },
  { to: "/admin/offers", label: "Offers", icon: BadgePercent, role: "manager" as const },
  { to: "/admin/reviews", label: "Reviews", icon: Star, role: "manager" as const },
  { to: "/admin/faqs", label: "AI Knowledge", icon: Brain, role: "editor" as const },
  { to: "/admin/explore", label: "Explore Wayanad", icon: MapPin, role: "manager" as const },
  { to: "/admin/explore/categories", label: "Explore Categories", icon: Tag, role: "manager" as const },
  { to: "/admin/explore/reviews", label: "Destination Reviews", icon: Star, role: "manager" as const },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, role: "super" as const },
  { to: "/admin/settings", label: "Settings", icon: Settings, role: "super" as const },
  { to: "/admin/users", label: "Users", icon: Users, role: "super" as const },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { roles, loading, isSuperAdmin, isManager, isEditor, claimOwner } = useRoles();
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!loading && roles && roles.length === 0) {
      toast.error("No admin access for this account");
    }
  }, [loading, roles]);

  const signOut = async () => { await supabase.auth.signOut(); router.replace("/auth"); router.refresh(); };

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }
  if (!roles || roles.length === 0) {
    const claim = async () => {
      setClaiming(true);
      const ok = await claimOwner();
      setClaiming(false);
      if (ok) toast.success("Owner access granted — welcome.");
      else toast.error("Owner access is already configured. Ask your super admin for access.");
    };
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="eyebrow">Access denied</p>
          <h1 className="mt-4 font-serif text-3xl text-foreground">No admin role assigned</h1>
          <p className="mt-4 text-sm text-muted-foreground">Ask your super admin to grant you access, or sign out and use a different account.</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button onClick={claim} disabled={claiming} className="inline-flex items-center gap-2 bg-gold px-6 py-3 text-xs uppercase tracking-[0.3em] text-gold-foreground disabled:opacity-50">
              {claiming && <Loader2 className="h-4 w-4 animate-spin" />} Claim owner access
            </button>
            <p className="text-[11px] text-muted-foreground">First-time setup only — works once, before any owner exists.</p>
            <button onClick={signOut} className="mt-2 inline-flex items-center gap-2 border-gold-hairline px-6 py-3 text-xs uppercase tracking-[0.3em] text-gold">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  const can = (r: NavRole) =>
    r === "super" ? isSuperAdmin : r === "manager" ? isManager : isEditor;

  // Per-page authorization: pick the most specific matching nav entry for the current
  // path and require its role. Blocks direct-URL access to a page above the user's tier.
  // Unknown admin paths require super_admin (fail safe).
  const matched = [...NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find((n) => (n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/")));
  const pageAllowed = can(matched?.role ?? "super");

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <AdminCursorOff />
      <aside className="w-64 shrink-0 border-r border-border/60 bg-bg-secondary hidden lg:flex flex-col">
        <div className="px-6 py-6 border-b border-border/60">
          <a href="/" className="font-serif text-xl text-foreground">Veycho <span className="italic text-gold">Admin</span></a>
          <p className="mt-1 eyebrow-muted text-[9px]">{roles.join(" · ")}</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.filter((n) => can(n.role)).map((n) => {
            const Icon = n.icon;
            const active = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to} href={n.to}
                className={["flex items-center gap-3 px-6 py-2.5 text-sm transition-colors",
                  active ? "bg-gold/10 text-gold border-l-2 border-gold" : "text-muted-foreground hover:text-foreground hover:bg-surface"
                ].join(" ")}
              >
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={signOut} className="m-4 flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-gold border border-border/60">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between border-b border-border/60 bg-bg-secondary px-4 py-3">
          <Link href="/admin" className="font-serif text-lg text-foreground">Veycho <span className="italic text-gold">Admin</span></Link>
          <button onClick={signOut} className="text-xs text-muted-foreground">Sign out</button>
        </header>
        <nav className="lg:hidden flex overflow-x-auto gap-1 border-b border-border/60 bg-bg-secondary px-2 py-2">
          {NAV.filter((n) => can(n.role)).map((n) => {
            const active = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link key={n.to} href={n.to} className={["whitespace-nowrap px-3 py-1.5 text-xs", active ? "bg-gold text-gold-foreground" : "text-muted-foreground"].join(" ")}>{n.label}</Link>
            );
          })}
        </nav>
        <main className="flex-1 overflow-auto p-6 lg:p-10">
          {pageAllowed ? (
            children
          ) : (
            <div className="grid min-h-[60vh] place-items-center px-4 text-center">
              <div className="max-w-md">
                <ShieldAlert className="mx-auto h-8 w-8 text-gold" />
                <h1 className="mt-4 font-serif text-2xl text-foreground">Not enough permissions</h1>
                <p className="mt-3 text-sm text-muted-foreground">Your role doesn&rsquo;t have access to this section. Choose another item from the menu, or ask a super admin for higher access.</p>
                <Link href="/admin" className="mt-6 inline-flex items-center gap-2 border-gold-hairline px-6 py-3 text-xs uppercase tracking-[0.3em] text-gold">Back to dashboard</Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
