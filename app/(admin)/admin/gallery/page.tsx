"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { Trash2, Edit, Loader2 } from "lucide-react";

type GalleryItem = {
  id: string;
  image_url: string;
  title: string | null;
  category: string | null;
  sort_order: number;
};

export default function GalleryAdmin() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const list = useQuery({ queryKey: ["gallery"], queryFn: async () => (await supabase.from("gallery").select("*").order("sort_order")).data ?? [] });

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { url } = await uploadImage("gallery-images", file);
        const { error } = await supabase.from("gallery").insert({ image_url: url, sort_order: (list.data?.length ?? 0) + 1 });
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Uploaded");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const update = useMutation({
    mutationFn: async (item: GalleryItem) => {
      const { error } = await supabase.from("gallery").update({
        title: item.title,
        category: item.category,
        sort_order: Number(item.sort_order) || 0,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gallery"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("gallery").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gallery"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <header className="mb-6"><p className="eyebrow">Gallery</p><h1 className="mt-2 font-serif text-3xl">Visual library</h1></header>
      <label className="block border-2 border-dashed border-border/60 p-8 text-center cursor-pointer hover:border-gold/60 mb-6">
        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-gold mx-auto" /> : <p className="text-sm text-muted-foreground">Click or drop images to upload</p>}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(list.data ?? []).map((g: any) => (
          <div key={g.id} className="relative group">
            <img src={g.image_url} alt={g.title ?? ""} className="aspect-square w-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100">
              <button onClick={() => setEditing(g)} className="bg-background/80 p-2 text-gold"><Edit className="h-4 w-4" /></button>
              <button onClick={() => confirm("Delete?") && del.mutate(g.id)} className="bg-background/80 p-2 text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
            {(g.title || g.category) && (
              <div className="absolute bottom-0 inset-x-0 bg-background/70 px-2 py-1 text-xs">
                {g.title && <span className="text-foreground">{g.title}</span>}
                {g.category && <span className="text-muted-foreground"> · {g.category}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && <GalleryModal item={editing} onClose={() => setEditing(null)} onSave={(it) => update.mutate(it)} saving={update.isPending} />}
    </div>
  );
}

function GalleryModal({ item, onClose, onSave, saving }: { item: GalleryItem; onClose: () => void; onSave: (i: GalleryItem) => void; saving: boolean }) {
  const [it, setIt] = useState<GalleryItem>(item);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-bg-secondary border-gold-hairline w-full max-w-lg p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-6">Edit image</h2>
        <img src={it.image_url} alt={it.title ?? ""} className="h-40 w-full object-cover mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <input className="col-span-2 bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Title" value={it.title ?? ""} onChange={(e) => setIt({ ...it, title: e.target.value })} />
          <input className="bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Category" value={it.category ?? ""} onChange={(e) => setIt({ ...it, category: e.target.value })} />
          <input type="number" className="bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Sort order" value={it.sort_order} onChange={(e) => setIt({ ...it, sort_order: Number(e.target.value) })} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-muted-foreground">Cancel</button>
          <button onClick={() => onSave(it)} disabled={saving} className="inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-gold-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
        </div>
      </div>
    </div>
  );
}
