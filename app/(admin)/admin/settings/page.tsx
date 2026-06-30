"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SettingsAdmin() {
  const qc = useQueryClient();
  const data = useQuery({ queryKey: ["settings_admin"], queryFn: async () => (await supabase.from("settings").select("*").limit(1).maybeSingle()).data });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data.data) setForm(data.data); else if (data.isFetched) setForm({ restaurant_name: "", phone: "", whatsapp: "", email: "", address: "", opening_hours: "", google_maps_url: "", logo_url: "", social_links_json: {} }); }, [data.data, data.isFetched]);

  const save = useMutation({
    mutationFn: async () => {
      if (form.id) { const { error } = await supabase.from("settings").update(form).eq("id", form.id); if (error) throw error; }
      else { const { error } = await supabase.from("settings").insert(form); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings_admin"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Favicon — stored in site_content "branding" section, read by layout.tsx
  const faviconQuery = useQuery({
    queryKey: ["branding_favicon"],
    queryFn: async () => {
      const { data } = await supabase.from("site_content").select("data").eq("section", "branding").maybeSingle();
      return (data?.data as { favicon_url?: string } | null)?.favicon_url ?? null;
    },
  });
  const [faviconUploading, setFaviconUploading] = useState(false);

  const saveFavicon = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase.from("site_content").upsert({ section: "branding", data: { favicon_url: url } }, { onConflict: "section" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["branding_favicon"] }); toast.success("Favicon updated — live within ~1 minute"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!form) return <Loader2 className="h-6 w-6 animate-spin text-gold" />;
  const social = form.social_links_json ?? {};
  const currentFavicon = faviconQuery.data ?? "/icon.png";

  return (
    <div className="max-w-2xl">
      <header className="mb-6"><p className="eyebrow">Settings</p><h1 className="mt-2 font-serif text-3xl">Restaurant info</h1></header>
      <div className="space-y-3">
        <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Restaurant name" value={form.restaurant_name ?? ""} onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })} />
        <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Phone" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="WhatsApp" value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <textarea className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Address" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Opening hours" value={form.opening_hours ?? ""} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} />
        <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Google Maps URL" value={form.google_maps_url ?? ""} onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className="bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Instagram URL" value={social.instagram ?? ""} onChange={(e) => setForm({ ...form, social_links_json: { ...social, instagram: e.target.value } })} />
          <input className="bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Facebook URL" value={social.facebook ?? ""} onChange={(e) => setForm({ ...form, social_links_json: { ...social, facebook: e.target.value } })} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-2">Logo</label>
          {form.logo_url && <img src={form.logo_url} className="h-16 mb-2 object-contain" />}
          <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const { url } = await uploadImage("logos", f); setForm({ ...form, logo_url: url }); } catch (err: any) { toast.error(err.message); } }} className="text-sm" />
        </div>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 bg-gold px-6 py-3 text-xs uppercase tracking-[0.3em] text-gold-foreground">{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
      </div>

      {/* ---- Favicon / App icon ---- */}
      <div className="mt-10 pt-8 border-t border-border/60">
        <h2 className="font-serif text-xl mb-1">Favicon &amp; App icon</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Shown in browser tabs and as the home-screen icon when someone bookmarks the site.
          Recommended: square PNG, 512×512. Takes effect within ~1 minute of saving.
        </p>
        <div className="flex items-start gap-5">
          {/* preview */}
          <div className="flex-none">
            <div className="w-16 h-16 rounded-xl border border-border/60 bg-surface overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={currentFavicon} src={currentFavicon} alt="Current favicon" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">Current</p>
          </div>
          {/* upload */}
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <span className="inline-flex items-center gap-1.5 bg-surface border border-border/60 hover:border-gold/60 hover:text-gold px-4 py-2 text-xs rounded transition-colors">
                {faviconUploading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                }
                {faviconUploading ? "Uploading…" : "Choose new icon"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={faviconUploading || saveFavicon.isPending}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setFaviconUploading(true);
                  try {
                    const { url } = await uploadImage("site-media", f);
                    saveFavicon.mutate(url);
                  } catch (err: any) {
                    toast.error(err.message);
                  } finally {
                    setFaviconUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Upload replaces the current icon immediately — no deploy needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
