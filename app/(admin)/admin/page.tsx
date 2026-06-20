"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { UtensilsCrossed, Image as ImageIcon, Star, Brain, MessageCircle, BarChart3 } from "lucide-react";

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="border-gold-hairline bg-bg-secondary p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow-muted">{label}</p>
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <p className="mt-4 font-serif text-4xl text-foreground">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const counts = await Promise.all([
        supabase.from("menu_items").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("gallery").select("*", { count: "exact", head: true }),
        supabase.from("chat_logs").select("*", { count: "exact", head: true }),
        supabase.from("analytics").select("*", { count: "exact", head: true }),
      ]);
      const recentChats = await supabase.from("chat_logs").select("*").order("created_at", { ascending: false }).limit(5);
      const recentReviews = await supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(5);
      return {
        menu: counts[0].count ?? 0,
        categories: counts[1].count ?? 0,
        reviews: counts[2].count ?? 0,
        gallery: counts[3].count ?? 0,
        chats: counts[4].count ?? 0,
        visits: counts[5].count ?? 0,
        recentChats: recentChats.data ?? [],
        recentReviews: recentReviews.data ?? [],
      };
    },
  });

  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow">Overview</p>
        <h1 className="mt-3 font-serif text-4xl text-foreground">Welcome back</h1>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat icon={UtensilsCrossed} label="Menu items" value={data?.menu ?? "—"} />
        <Stat icon={UtensilsCrossed} label="Categories" value={data?.categories ?? "—"} />
        <Stat icon={Star} label="Reviews" value={data?.reviews ?? "—"} />
        <Stat icon={ImageIcon} label="Gallery" value={data?.gallery ?? "—"} />
        <Stat icon={MessageCircle} label="AI conversations" value={data?.chats ?? "—"} />
        <Stat icon={BarChart3} label="Tracked events" value={data?.visits ?? "—"} />
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-6">
        <section className="border border-border/60 bg-bg-secondary p-6">
          <h2 className="font-serif text-xl text-foreground mb-4">Recent AI conversations</h2>
          <ul className="space-y-3">
            {(data?.recentChats ?? []).map((c: any) => (
              <li key={c.id} className="text-sm">
                <p className="text-foreground/90 truncate">Q: {c.question}</p>
                <p className="text-muted-foreground text-xs truncate">A: {c.answer}</p>
              </li>
            ))}
            {!data?.recentChats?.length && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
          </ul>
        </section>
        <section className="border border-border/60 bg-bg-secondary p-6">
          <h2 className="font-serif text-xl text-foreground mb-4">Recent reviews</h2>
          <ul className="space-y-3">
            {(data?.recentReviews ?? []).map((r: any) => (
              <li key={r.id} className="text-sm">
                <p className="text-gold">{r.name} · {"★".repeat(r.rating)}</p>
                <p className="text-muted-foreground text-xs truncate">{r.review_text}</p>
              </li>
            ))}
            {!data?.recentReviews?.length && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}
