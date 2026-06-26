"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, GripVertical, AlertTriangle } from "lucide-react";
import type { DestinationCategory } from "@/lib/explore";

function SetupBanner({ error }: { error: unknown }) {
  const msg = String((error as Error)?.message ?? "");
  const isTableMissing =
    msg.includes("schema cache") || msg.includes("does not exist") || msg.includes("relation");
  if (!isTableMissing) return null;
  return (
    <div className="mb-6 rounded border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-300">Database tables not found</p>
          <p className="mt-1 text-xs text-amber-400/80">
            Run <code className="font-mono bg-black/30 px-1 rounded">supabase/explore_migration.sql</code> in
            your Supabase Dashboard → SQL Editor, then refresh this page.
          </p>
          <p className="mt-2 text-xs text-amber-400/60 font-mono">{msg}</p>
        </div>
      </div>
    </div>
  );
}

const EMPTY: Partial<DestinationCategory> = {
  name: "", slug: "", icon: "📍", sort_order: 0, enabled: true,
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const inp = "w-full bg-surface border border-border/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold";

export default function ExploreCategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<DestinationCategory> | null>(null);

  const cats = useQuery({
    queryKey: ["dest_categories_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destination_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as DestinationCategory[];
    },
    retry: false,
  });

  const save = useMutation({
    mutationFn: async (c: Partial<DestinationCategory>) => {
      const payload = {
        name: c.name?.trim() ?? "",
        slug: c.slug?.trim() || slugify(c.name ?? ""),
        icon: c.icon?.trim() || "📍",
        sort_order: c.sort_order ?? 0,
        enabled: c.enabled ?? true,
      };
      if (c.id) {
        const { error } = await supabase.from("destination_categories").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("destination_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dest_categories_admin"] });
      qc.invalidateQueries({ queryKey: ["dest_categories"] });
      setEditing(null);
      toast.success("Category saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("destination_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dest_categories_admin"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("destination_categories").update({ enabled: !enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dest_categories_admin"] }),
  });

  const list = cats.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Explore Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage destination categories for /explore filter pills
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY, sort_order: list.length + 1 })}
          disabled={cats.isError}
          className="inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {cats.isError && <SetupBanner error={cats.error} />}

      {cats.isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : !cats.isError && (
        <div className="rounded border border-border/60 divide-y divide-border/40">
          {list.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No categories yet — click Add Category to create your first one.
            </div>
          ) : list.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 px-4 py-3 bg-background hover:bg-bg-secondary transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <span className="text-2xl w-8 text-center">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">/{c.slug} · sort {c.sort_order}</p>
              </div>
              <button
                onClick={() => toggleEnabled.mutate({ id: c.id, enabled: c.enabled })}
                className={["px-2 py-1 text-[10px] uppercase tracking-[0.1em]",
                  c.enabled ? "text-green-400 bg-green-900/30" : "text-muted-foreground bg-surface"
                ].join(" ")}
              >
                {c.enabled ? "Enabled" : "Disabled"}
              </button>
              <button onClick={() => setEditing(c)} className="p-1.5 text-muted-foreground hover:text-gold transition-colors">
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => { if (window.confirm(`Delete "${c.name}"?`)) remove.mutate(c.id); }}
                className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-md bg-background border border-border/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border/60 px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">{editing.id ? "Edit" : "Add"} Category</h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Name *</label>
                  <input className={inp} value={editing.name ?? ""} onChange={(e) => {
                    const name = e.target.value;
                    setEditing((p) => ({ ...p!, name, slug: p?.id ? p.slug : slugify(name) }));
                  }} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Icon (emoji)</label>
                  <input className={inp + " text-2xl text-center"} value={editing.icon ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, icon: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Slug *</label>
                <input className={inp} value={editing.slug ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, slug: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Sort Order</label>
                <input type="number" className={inp} value={editing.sort_order ?? 0} onChange={(e) => setEditing((p) => ({ ...p!, sort_order: Number(e.target.value) }))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input type="checkbox" checked={editing.enabled ?? true} onChange={(e) => setEditing((p) => ({ ...p!, enabled: e.target.checked }))} className="accent-gold" />
                Enabled (visible in filter pills)
              </label>
            </div>
            <div className="border-t border-border/60 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground">Cancel</button>
              <button
                onClick={() => save.mutate(editing)}
                disabled={save.isPending || !editing.name}
                className="inline-flex items-center gap-2 bg-gold px-5 py-2 text-xs uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-50"
              >
                {save.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {editing.id ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
