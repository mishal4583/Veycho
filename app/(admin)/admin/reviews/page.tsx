"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Star, Check, Archive, ArchiveRestore, RefreshCw, MessageSquare } from "lucide-react";

type Review = {
  id: string;
  name: string;
  rating: number;
  review_text: string;
  source: string | null;
  approved: boolean;
  featured: boolean;
  archived: boolean;
  created_at: string;
};

type Tab = "active" | "archived" | "all";

const RATING_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

export default function ReviewsAdmin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("active");
  const [syncing, setSyncing] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Review> }) => {
      const { error } = await supabase.from("reviews").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews_admin"] });
      toast.success("Updated");
    },
    onError: () => toast.error("Update failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews_admin"] });
      toast.success("Review deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  const syncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/reviews/sync", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Sync complete — ${json.inserted} new review${json.inserted !== 1 ? "s" : ""} added`);
        qc.invalidateQueries({ queryKey: ["reviews_admin"] });
      } else if (json.skipped) {
        toast.info("Sync skipped: " + json.reason);
      } else {
        toast.error("Sync failed: " + (json.error ?? "unknown error"));
      }
    } catch {
      toast.error("Sync request failed");
    } finally {
      setSyncing(false);
    }
  };

  const confirmDelete = (r: Review) => {
    if (window.confirm(`Permanently delete ${r.name}'s review? This cannot be undone.`)) {
      del.mutate(r.id);
    }
  };

  const active  = reviews.filter((r) => !r.archived);
  const archived = reviews.filter((r) => r.archived);
  const visible  = tab === "active" ? active : tab === "archived" ? archived : reviews;

  const googleCount  = reviews.filter((r) => r.source === "google").length;
  const manualCount  = reviews.filter((r) => r.source !== "google").length;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "active",   label: "Active",   count: active.length },
    { key: "archived", label: "Archived", count: archived.length },
    { key: "all",      label: "All",      count: reviews.length },
  ];

  return (
    <div>
      {/* header */}
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Reviews</p>
          <h1 className="mt-2 font-serif text-3xl">Moderation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {reviews.length} total · {googleCount} from Google · {manualCount} manual
          </p>
        </div>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="inline-flex items-center gap-2 border border-border/60 bg-bg-secondary px-4 py-2 text-sm text-foreground hover:text-gold hover:border-gold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync Google now"}
        </button>
      </header>

      {/* tabs */}
      <div className="flex gap-1 mb-5 border-b border-border/60">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "px-4 py-2 text-sm border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground py-10 text-center">Loading…</p>
      )}

      {!isLoading && visible.length === 0 && (
        <div className="border border-border/60 bg-bg-secondary py-16 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {tab === "archived" ? "No archived reviews." : "No reviews yet."}
          </p>
        </div>
      )}

      {!isLoading && visible.length > 0 && (
        <ul className="border border-border/60 bg-bg-secondary divide-y divide-border/30">
          {visible.map((r) => (
            <li key={r.id} className={`p-4 transition-colors ${r.archived ? "opacity-60" : "hover:bg-surface/40"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* name + rating + source */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-foreground text-sm">{r.name}</span>
                    <span className="text-sm font-semibold" style={{ color: RATING_COLORS[r.rating] }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                    {r.source === "google" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-full">Google</span>
                    )}
                    {r.source !== "google" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gold/15 text-gold rounded-full">Manual</span>
                    )}
                    {r.featured && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gold/10 text-gold rounded-full">Featured</span>
                    )}
                    {r.archived && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted/30 text-muted-foreground rounded-full">Archived</span>
                    )}
                  </div>

                  <p className="text-sm text-foreground/80 leading-relaxed mb-1.5">{r.review_text}</p>

                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}
                    {r.approved ? "Approved" : <span className="text-amber-400">Pending</span>}
                  </p>
                </div>

                {/* actions */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  {/* approve toggle */}
                  <button
                    onClick={() => update.mutate({ id: r.id, patch: { approved: !r.approved } })}
                    title={r.approved ? "Unapprove" : "Approve"}
                    className={`p-2 transition-colors ${r.approved ? "text-emerald-400" : "text-muted-foreground hover:text-emerald-400"}`}
                  >
                    <Check className="h-4 w-4" />
                  </button>

                  {/* feature toggle */}
                  <button
                    onClick={() => update.mutate({ id: r.id, patch: { featured: !r.featured } })}
                    title={r.featured ? "Unfeature" : "Feature"}
                    className={`p-2 transition-colors ${r.featured ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                  >
                    <Star className="h-4 w-4" />
                  </button>

                  {/* archive / unarchive */}
                  <button
                    onClick={() => update.mutate({ id: r.id, patch: { archived: !r.archived } })}
                    title={r.archived ? "Unarchive" : "Archive"}
                    className="p-2 text-muted-foreground hover:text-amber-400 transition-colors"
                  >
                    {r.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </button>

                  {/* delete */}
                  <button
                    onClick={() => confirmDelete(r)}
                    disabled={del.isPending}
                    title="Delete permanently"
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {visible.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {visible.length} review{visible.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
