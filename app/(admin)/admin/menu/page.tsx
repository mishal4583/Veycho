"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";

type Item = {
  id?: string; name: string; description: string | null; price: number;
  category_id: string | null; is_veg: boolean; is_popular: boolean;
  is_chef_special: boolean; spice_level: number | null; ingredients: string | null;
  availability: boolean; image_url: string | null; tag: string | null;
};
const EMPTY: Item = { name: "", description: "", price: 0, category_id: null, is_veg: false, is_popular: false, is_chef_special: false, spice_level: 1, ingredients: "", availability: true, image_url: null, tag: null };

export default function MenuAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [filterVeg, setFilterVeg] = useState<string>("");

  const items = useQuery({
    queryKey: ["menu_items"],
    queryFn: async () => (await supabase.from("menu_items").select("*, categories(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const cats = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });

  const save = useMutation({
    mutationFn: async (item: Item) => {
      // Build the payload from real columns only. The list query joins `categories(name)`,
      // so an edited row also carries a nested `categories` object (and created_at/updated_at)
      // that must NOT be sent to update/insert — PostgREST would reject them as unknown columns.
      const payload = {
        name: item.name,
        description: item.description,
        price: Number(item.price) || 0,
        category_id: item.category_id,
        is_veg: item.is_veg,
        is_popular: item.is_popular,
        is_chef_special: item.is_chef_special,
        spice_level: item.spice_level,
        ingredients: item.ingredients,
        availability: item.availability,
        image_url: item.image_url,
        tag: item.tag,
      };
      if (item.id) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["menu_items"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("menu_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["menu_items"] }); toast.success("Deleted"); },
  });

  const filtered = (items.data ?? []).filter((m: any) =>
    (!search || m.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || m.category_id === filterCat) &&
    (!filterVeg || (filterVeg === "veg" ? m.is_veg : !m.is_veg))
  );

  return (
    <div>
      <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div><p className="eyebrow">Menu</p><h1 className="mt-2 font-serif text-3xl">All dishes</h1></div>
        <button onClick={() => setEditing(EMPTY)} className="inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-gold-foreground"><Plus className="h-4 w-4" /> New</button>
      </header>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="bg-surface border border-border/60 px-3 py-2 text-sm" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="bg-surface border border-border/60 px-3 py-2 text-sm">
          <option value="">All categories</option>
          {(cats.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterVeg} onChange={(e) => setFilterVeg(e.target.value)} className="bg-surface border border-border/60 px-3 py-2 text-sm">
          <option value="">All diets</option><option value="veg">Veg</option><option value="nonveg">Non-veg</option>
        </select>
      </div>

      <div className="border border-border/60 bg-bg-secondary overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border/60">
            <th className="p-3">Name</th><th className="p-3">Cat</th><th className="p-3">Price</th><th className="p-3">Flags</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {filtered.map((m: any) => (
              <tr key={m.id} className="border-b border-border/30">
                <td className="p-3"><div className="font-medium text-foreground">{m.name}</div><div className="text-xs text-muted-foreground">{m.description}</div></td>
                <td className="p-3 text-muted-foreground">{m.categories?.name ?? "—"}</td>
                <td className="p-3 text-gold">₹{m.price}</td>
                <td className="p-3 text-xs">{m.is_veg ? "veg" : "non-veg"}{m.is_popular && " · pop"}{m.is_chef_special && " · special"}{!m.availability && " · hidden"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEditing(m)} className="p-2 text-muted-foreground hover:text-gold"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => confirm("Delete?") && del.mutate(m.id)} className="p-2 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No items</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && <MenuModal item={editing} cats={cats.data ?? []} onClose={() => setEditing(null)} onSave={(it) => save.mutate(it)} saving={save.isPending} />}
    </div>
  );
}

function MenuModal({ item, cats, onClose, onSave, saving }: { item: Item; cats: any[]; onClose: () => void; onSave: (i: Item) => void; saving: boolean }) {
  const [it, setIt] = useState<Item>(item);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (f: File) => {
    setUploading(true);
    try { const { url } = await uploadImage("menu-images", f); setIt({ ...it, image_url: url }); }
    catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-bg-secondary border-gold-hairline w-full max-w-2xl p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-6">{it.id ? "Edit dish" : "New dish"}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="col-span-2 bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Name" value={it.name} onChange={(e) => setIt({ ...it, name: e.target.value })} />
          <textarea className="col-span-2 bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Description" value={it.description ?? ""} onChange={(e) => setIt({ ...it, description: e.target.value })} />
          <input type="number" step="0.01" className="bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Price" value={it.price} onChange={(e) => setIt({ ...it, price: Number(e.target.value) })} />
          <select className="bg-surface border border-border/60 px-3 py-2 text-sm" value={it.category_id ?? ""} onChange={(e) => setIt({ ...it, category_id: e.target.value || null })}>
            <option value="">No category</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Tag (e.g. Signature)" value={it.tag ?? ""} onChange={(e) => setIt({ ...it, tag: e.target.value })} />
          <input type="number" min="0" max="5" className="bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Spice (0-5)" value={it.spice_level ?? 1} onChange={(e) => setIt({ ...it, spice_level: Number(e.target.value) })} />
          <textarea className="col-span-2 bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Ingredients" value={it.ingredients ?? ""} onChange={(e) => setIt({ ...it, ingredients: e.target.value })} />
          <div className="col-span-2 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={it.is_veg} onChange={(e) => setIt({ ...it, is_veg: e.target.checked })} /> Veg</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={it.is_popular} onChange={(e) => setIt({ ...it, is_popular: e.target.checked })} /> Popular</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={it.is_chef_special} onChange={(e) => setIt({ ...it, is_chef_special: e.target.checked })} /> Chef special</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={it.availability} onChange={(e) => setIt({ ...it, availability: e.target.checked })} /> Available</label>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-muted-foreground mb-2">Image</label>
            {it.image_url && <img src={it.image_url} alt="" className="h-32 mb-2 object-cover" />}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="text-sm" />
            {uploading && <Loader2 className="inline ml-2 h-4 w-4 animate-spin text-gold" />}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-muted-foreground">Cancel</button>
          <button onClick={() => onSave(it)} disabled={saving || uploading} className="inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-gold-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
        </div>
      </div>
    </div>
  );
}
