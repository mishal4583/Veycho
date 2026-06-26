"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Star, MessageSquare, MapPin, Filter } from "lucide-react";

type Review = {
  id: string;
  destination_id: string;
  author_name: string;
  rating: number;
  body: string;
  visit_type: string | null;
  visit_month: string | null;
  created_at: string;
  destinations: { title: string; slug: string } | null;
};

const VISIT_LABELS: Record<string, string> = {
  solo: "Solo", couple: "Couple", family: "Family", group: "Group",
};

const RATING_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

export default function DestinationReviewsAdmin() {
  const qc = useQueryClient();
  const [filterDest, setFilterDest] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["dest_reviews_admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("destination_reviews")
        .select("*, destinations(title, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("destination_reviews")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dest_reviews_admin"] });
      toast.success("Review deleted");
    },
    onError: () => toast.error("Failed to delete — check your permissions"),
  });

  const destinations = Array.from(
    new Map(reviews.map((r) => [r.destination_id, r.destinations?.title ?? "Unknown"])).entries()
  );

  const filtered = reviews.filter((r) => {
    if (filterDest !== "all" && r.destination_id !== filterDest) return false;
    if (filterRating !== "all" && String(r.rating) !== filterRating) return false;
    return true;
  });

  const avg = (list: Review[]) =>
    list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : "—";

  const confirmDelete = (id: string, name: string) => {
    if (window.confirm(`Delete ${name}'s review? This cannot be undone.`)) {
      del.mutate(id);
    }
  };

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Explore Wayanad</p>
          <h1 className="mt-2 font-serif text-3xl">Destination Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {reviews.length} total review{reviews.length !== 1 ? "s" : ""} across {destinations.length} destination{destinations.length !== 1 ? "s" : ""} · avg {avg(reviews)} ★
          </p>
        </div>
      </header>

      {/* filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterDest}
            onChange={(e) => setFilterDest(e.target.value)}
            className="text-sm border border-border/60 bg-bg-secondary px-3 py-1.5 text-foreground"
          >
            <option value="all">All destinations</option>
            {destinations.map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
        </div>
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="text-sm border border-border/60 bg-bg-secondary px-3 py-1.5 text-foreground"
        >
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={String(n)}>{"★".repeat(n)} ({n} star{n !== 1 ? "s" : ""})</option>
          ))}
        </select>
        {(filterDest !== "all" || filterRating !== "all") && (
          <button
            onClick={() => { setFilterDest("all"); setFilterRating("all"); }}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground py-10 text-center">Loading reviews…</p>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="border border-border/60 bg-bg-secondary py-16 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {reviews.length === 0
              ? "No reviews yet. They'll appear here once visitors start submitting."
              : "No reviews match the current filters."}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <ul className="border border-border/60 bg-bg-secondary divide-y divide-border/30">
          {filtered.map((r) => (
            <li key={r.id} className="p-4 hover:bg-surface/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* destination + meta row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {r.destinations?.title ?? "Unknown destination"}
                    </span>
                    <span className="text-border/60">·</span>
                    {/* star rating */}
                    <span className="text-sm font-semibold" style={{ color: RATING_COLORS[r.rating] }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                    {r.visit_type && (
                      <>
                        <span className="text-border/60">·</span>
                        <span className="text-xs text-muted-foreground">{VISIT_LABELS[r.visit_type] ?? r.visit_type}</span>
                      </>
                    )}
                    {r.visit_month && (
                      <>
                        <span className="text-border/60">·</span>
                        <span className="text-xs text-muted-foreground">{r.visit_month}</span>
                      </>
                    )}
                  </div>

                  {/* author + date */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-foreground">{r.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* review body */}
                  <p className="text-sm text-foreground/80 leading-relaxed">{r.body}</p>
                </div>

                {/* delete button */}
                <button
                  onClick={() => confirmDelete(r.id, r.author_name)}
                  disabled={del.isPending}
                  title="Delete review"
                  className="shrink-0 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          {filtered.length > 0 && ` · avg ${avg(filtered)} ★ for current filter`}
        </p>
      )}
    </div>
  );
}
