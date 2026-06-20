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

  if (!form) return <Loader2 className="h-6 w-6 animate-spin text-gold" />;
  const social = form.social_links_json ?? {};

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
    </div>
  );
}
