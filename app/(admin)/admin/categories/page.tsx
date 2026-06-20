"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";

type Category = { id: string; name: string; slug: string; sort_order: number };

export default function CategoriesAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const list = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });

  const add = useMutation({
    mutationFn: async () => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const sort = (list.data?.length ?? 0) + 1;
      const { error } = await supabase.from("categories").insert({ name, slug, sort_order: sort });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Added"); },
    onError: (e: any) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async ({ id, sort }: { id: string; sort: number }) => { const { error } = await supabase.from("categories").update({ sort_order: sort }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    onError: (e: any) => toast.error(e.message),
  });
  const save = useMutation({
    mutationFn: async (cat: Category) => {
      const { error } = await supabase.from("categories").update({ name: cat.name, slug: cat.slug, sort_order: Number(cat.sort_order) || 0 }).eq("id", cat.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <header className="mb-6"><p className="eyebrow">Categories</p><h1 className="mt-2 font-serif text-3xl">Menu sections</h1></header>
      <form onSubmit={(e) => { e.preventDefault(); if (name) add.mutate(); }} className="flex gap-3 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="flex-1 bg-surface border border-border/60 px-3 py-2 text-sm" />
        <button className="inline-flex items-center gap-2 bg-gold px-5 py-2 text-xs uppercase tracking-[0.3em] text-gold-foreground"><Plus className="h-4 w-4" /> Add</button>
      </form>
      <ul className="border border-border/60 bg-bg-secondary divide-y divide-border/30">
        {(list.data ?? []).map((c: any) => (
          <li key={c.id} className="flex items-center justify-between p-4">
            <div><div className="text-foreground">{c.name}</div><div className="text-xs text-muted-foreground">{c.slug}</div></div>
            <div className="flex items-center gap-3">
              <input type="number" defaultValue={c.sort_order} onBlur={(e) => update.mutate({ id: c.id, sort: Number(e.target.value) })} className="w-16 bg-surface border border-border/60 px-2 py-1 text-sm" />
              <button onClick={() => setEditing(c)} className="text-muted-foreground hover:text-gold"><Edit className="h-4 w-4" /></button>
              <button onClick={() => confirm("Delete?") && del.mutate(c.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
        {!list.data?.length && <li className="p-6 text-center text-muted-foreground text-sm">No categories</li>}
      </ul>

      {editing && <CategoryModal category={editing} onClose={() => setEditing(null)} onSave={(c) => save.mutate(c)} saving={save.isPending} />}
    </div>
  );
}

function CategoryModal({ category, onClose, onSave, saving }: { category: Category; onClose: () => void; onSave: (c: Category) => void; saving: boolean }) {
  const [c, setC] = useState<Category>(category);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-bg-secondary border-gold-hairline w-full max-w-md p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-6">Edit category</h2>
        <div className="grid gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Name</label>
            <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Slug</label>
            <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Slug" value={c.slug} onChange={(e) => setC({ ...c, slug: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Sort order</label>
            <input type="number" className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Sort order" value={c.sort_order} onChange={(e) => setC({ ...c, sort_order: Number(e.target.value) })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-muted-foreground">Cancel</button>
          <button onClick={() => onSave(c)} disabled={saving || !c.name || !c.slug} className="inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-gold-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
        </div>
      </div>
    </div>
  );
}
