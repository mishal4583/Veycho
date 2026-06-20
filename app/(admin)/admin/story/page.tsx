"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

type TL = { year: string; title: string; body: string };

export default function StoryAdmin() {
  const qc = useQueryClient();
  const story = useQuery({ queryKey: ["story_admin"], queryFn: async () => (await supabase.from("story").select("*").limit(1).maybeSingle()).data });
  const [form, setForm] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => { if (story.data) setForm(story.data); else if (story.isFetched) setForm({ title: "", subtitle: "", content: "", timeline_json: [], founder_image: "" }); }, [story.data, story.isFetched]);

  const save = useMutation({
    mutationFn: async () => {
      if (form.id) { const { error } = await supabase.from("story").update({ title: form.title, subtitle: form.subtitle, content: form.content, timeline_json: form.timeline_json, founder_image: form.founder_image }).eq("id", form.id); if (error) throw error; }
      else { const { error } = await supabase.from("story").insert({ title: form.title, subtitle: form.subtitle, content: form.content, timeline_json: form.timeline_json, founder_image: form.founder_image }); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["story_admin"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!form) return <Loader2 className="h-6 w-6 animate-spin text-gold" />;
  const timeline: TL[] = Array.isArray(form.timeline_json) ? form.timeline_json : [];

  return (
    <div className="max-w-3xl">
      <header className="mb-6"><p className="eyebrow">Story</p><h1 className="mt-2 font-serif text-3xl">Brand narrative</h1></header>
      <div className="space-y-4">
        <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Eyebrow (subtitle)" value={form.subtitle ?? ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Title" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea rows={6} className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Story content" value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <div>
          <label className="block text-xs text-muted-foreground mb-2">Founder image</label>
          {form.founder_image && <img src={form.founder_image} className="h-32 mb-2 object-cover" />}
          <input type="file" accept="image/*" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            setUploading(true);
            try { const { url } = await uploadImage("story-images", f); setForm({ ...form, founder_image: url }); }
            catch (err: any) { toast.error(err.message); } finally { setUploading(false); }
          }} className="text-sm" />
          {uploading && <Loader2 className="inline ml-2 h-4 w-4 animate-spin text-gold" />}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2"><h2 className="font-serif text-xl">Timeline</h2>
            <button onClick={() => setForm({ ...form, timeline_json: [...timeline, { year: "", title: "", body: "" }] })} className="inline-flex items-center gap-1 text-xs text-gold"><Plus className="h-3 w-3" /> Add</button>
          </div>
          <div className="space-y-2">
            {timeline.map((t, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_auto] gap-2 items-start">
                <input value={t.year} onChange={(e) => { const tl = [...timeline]; tl[i] = { ...t, year: e.target.value }; setForm({ ...form, timeline_json: tl }); }} placeholder="Year" className="bg-surface border border-border/60 px-2 py-1.5 text-sm" />
                <div className="space-y-1">
                  <input value={t.title} onChange={(e) => { const tl = [...timeline]; tl[i] = { ...t, title: e.target.value }; setForm({ ...form, timeline_json: tl }); }} placeholder="Title" className="w-full bg-surface border border-border/60 px-2 py-1.5 text-sm" />
                  <input value={t.body} onChange={(e) => { const tl = [...timeline]; tl[i] = { ...t, body: e.target.value }; setForm({ ...form, timeline_json: tl }); }} placeholder="Body" className="w-full bg-surface border border-border/60 px-2 py-1.5 text-sm" />
                </div>
                <button onClick={() => setForm({ ...form, timeline_json: timeline.filter((_, j) => j !== i) })} className="p-2 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 bg-gold px-6 py-3 text-xs uppercase tracking-[0.3em] text-gold-foreground disabled:opacity-50">{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
      </div>
    </div>
  );
}
