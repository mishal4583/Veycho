"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";

type Offer = {
  id?: string; title: string; description: string | null; banner_url: string | null;
  start_date: string | null; expiry_date: string | null; active: boolean;
};
const EMPTY: Offer = { title: "", description: "", banner_url: "", start_date: "", expiry_date: "", active: true };

export default function OffersAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Offer | null>(null);
  const list = useQuery({ queryKey: ["offers_admin"], queryFn: async () => (await supabase.from("offers").select("*").order("created_at", { ascending: false })).data ?? [] });

  const save = useMutation({
    mutationFn: async (offer: Offer) => {
      const payload = { ...offer, start_date: offer.start_date || null, expiry_date: offer.expiry_date || null };
      if (offer.id) {
        const { error } = await supabase.from("offers").update(payload).eq("id", offer.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = payload as any;
        const { error } = await supabase.from("offers").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers_admin"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => { const { error } = await supabase.from("offers").update({ active }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers_admin"] }),
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("offers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers_admin"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <header className="mb-6 flex items-center justify-between"><div><p className="eyebrow">Offers</p><h1 className="mt-2 font-serif text-3xl">Promotions</h1></div>
        <button onClick={() => setEditing(EMPTY)} className="inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-gold-foreground"><Plus className="h-4 w-4" /> New</button>
      </header>
      <ul className="border border-border/60 bg-bg-secondary divide-y divide-border/30">
        {(list.data ?? []).map((o: any) => (
          <li key={o.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-foreground">{o.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{o.description}</div>
              <div className="text-xs text-muted-foreground mt-1">Expires: {o.expiry_date ? new Date(o.expiry_date).toLocaleDateString() : "—"}</div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={o.active} onChange={(e) => toggle.mutate({ id: o.id, active: e.target.checked })} /> Active</label>
              <button onClick={() => setEditing(o)} className="text-muted-foreground hover:text-gold"><Edit className="h-4 w-4" /></button>
              <button onClick={() => confirm("Delete?") && del.mutate(o.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
        {!list.data?.length && <li className="p-6 text-center text-muted-foreground text-sm">No offers</li>}
      </ul>

      {editing && <OfferModal offer={editing} onClose={() => setEditing(null)} onSave={(o) => save.mutate(o)} saving={save.isPending} />}
    </div>
  );
}

function OfferModal({ offer, onClose, onSave, saving }: { offer: Offer; onClose: () => void; onSave: (o: Offer) => void; saving: boolean }) {
  const [o, setO] = useState<Offer>(offer);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (f: File) => {
    setUploading(true);
    try { const { url } = await uploadImage("offers-images", f); setO({ ...o, banner_url: url }); }
    catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-bg-secondary border-gold-hairline w-full max-w-lg p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-4">{o.id ? "Edit offer" : "New offer"}</h2>
        <div className="space-y-3">
          <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Title" value={o.title} onChange={(e) => setO({ ...o, title: e.target.value })} />
          <textarea className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Description" value={o.description ?? ""} onChange={(e) => setO({ ...o, description: e.target.value })} />
          <input type="date" className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" value={o.start_date ?? ""} onChange={(e) => setO({ ...o, start_date: e.target.value })} />
          <input type="date" className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" value={o.expiry_date ?? ""} onChange={(e) => setO({ ...o, expiry_date: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={o.active} onChange={(e) => setO({ ...o, active: e.target.checked })} /> Active</label>
          {o.banner_url && <img src={o.banner_url} className="h-24 object-cover" />}
          <div>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="text-sm" />
            {uploading && <Loader2 className="inline ml-2 h-4 w-4 animate-spin text-gold" />}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-muted-foreground">Cancel</button>
          <button onClick={() => onSave(o)} disabled={saving || uploading} className="inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-gold-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
        </div>
      </div>
    </div>
  );
}
