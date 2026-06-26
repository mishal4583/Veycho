"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, Eye, EyeOff, Star, Loader2,
  MapPin, ImagePlus, X, GripVertical, AlertTriangle, UploadCloud, Tag,
} from "lucide-react";
import type { Destination, DestinationCategory, DestinationImage, TravelTip } from "@/lib/explore";

const BUCKET = "explore-images";

const EMPTY: Partial<Destination> = {
  title: "", slug: "", short_description: "", description: "",
  category_id: null, featured_image: null, google_maps_url: null,
  latitude: null, longitude: null, distance_km: null, travel_time: null,
  entry_fee: null, best_time: null, best_season: null, opening_hours: null,
  difficulty_level: null, family_friendly: true, parking_available: true,
  amenities: [], travel_tips: [], featured: false, google_rating: null, seo_title: null, seo_description: null,
  status: "draft",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

const inp = "w-full bg-surface border border-border/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold";
const ta = inp + " resize-y min-h-[100px]";

function SetupBanner({ error }: { error: unknown }) {
  const msg = String((error as Error)?.message ?? "");
  const isTableMissing = msg.includes("schema cache") || msg.includes("does not exist") || msg.includes("relation");
  if (!isTableMissing) return null;
  return (
    <div className="mb-6 rounded border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-300">Database tables not found</p>
          <p className="mt-1 text-xs text-amber-400/80">
            Run <code className="font-mono bg-black/30 px-1 rounded">supabase/explore_migration.sql</code> in
            Supabase Dashboard → SQL Editor, then refresh.
          </p>
          <p className="mt-2 text-xs text-amber-400/60 font-mono break-all">{msg}</p>
        </div>
      </div>
    </div>
  );
}

// ── Gallery manager ────────────────────────────────────────────────────────
function GalleryManager({ destId }: { destId: string }) {
  const qc = useQueryClient();
  const [urlInput, setUrlInput] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading, error } = useQuery<DestinationImage[]>({
    queryKey: ["dest_images", destId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destination_images")
        .select("*")
        .eq("destination_id", destId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as DestinationImage[];
    },
  });

  const addByUrl = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase.from("destination_images").insert({
        destination_id: destId,
        image_url: url.trim(),
        sort_order: images.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dest_images", destId] });
      qc.invalidateQueries({ queryKey: ["admin_destinations"] });
      setUrlInput("");
      toast.success("Image added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("destination_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dest_images", destId] });
      qc.invalidateQueries({ queryKey: ["admin_destinations"] });
      toast.success("Photo removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadFiles = async (files: FileList) => {
    const arr = Array.from(files);
    const baseOrder = images.length;
    setProgress({ done: 0, total: arr.length });
    const failed: string[] = [];
    for (let i = 0; i < arr.length; i++) {
      try {
        const { url } = await uploadImage(BUCKET, arr[i], `gallery/${destId}`);
        const { error } = await supabase.from("destination_images").insert({
          destination_id: destId,
          image_url: url,
          sort_order: baseOrder + i,
        });
        if (error) throw error;
      } catch (e: unknown) {
        failed.push(arr[i].name);
      }
      setProgress({ done: i + 1, total: arr.length });
    }
    await qc.invalidateQueries({ queryKey: ["dest_images", destId] });
    await qc.invalidateQueries({ queryKey: ["admin_destinations"] });
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";
    if (failed.length) {
      toast.error(`${failed.length} photo(s) failed to upload`);
    } else {
      toast.success(`${arr.length} photo${arr.length > 1 ? "s" : ""} uploaded`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading gallery…
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-red-400 py-2">Could not load gallery — {(error as Error).message}</p>;
  }

  return (
    <div className="border-t border-border/40 pt-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.15em] text-gold font-medium">Gallery Photos</p>
        <span className="text-xs text-muted-foreground">{images.length} photo{images.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Upload drop zone */}
      <label className="group flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-border/40 hover:border-gold/50 bg-surface/30 hover:bg-surface/60 transition-colors cursor-pointer py-6 rounded">
        {progress ? (
          <>
            <Loader2 className="h-6 w-6 text-gold animate-spin" />
            <span className="text-xs text-muted-foreground">Uploading {progress.done} / {progress.total}…</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-muted-foreground/40 group-hover:text-gold/60 transition-colors" />
            <span className="text-xs text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
              Click to add photos — select multiple at once with Ctrl / ⌘
            </span>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => { const f = e.target.files; if (f?.length) uploadFiles(f); }}
        />
      </label>

      {/* Existing photos grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-video rounded overflow-hidden bg-surface">
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <button
                onClick={() => remove.mutate(img.id)}
                disabled={remove.isPending}
                className="absolute top-1.5 right-1.5 p-1 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
              <GripVertical className="absolute bottom-1 left-1.5 h-4 w-4 text-white/0 group-hover:text-white/50 transition-colors pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {/* URL input */}
      <div className="flex gap-2">
        <input
          className={inp + " flex-1 text-xs"}
          placeholder="Or paste an image URL…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && urlInput.trim()) addByUrl.mutate(urlInput); }}
        />
        <button
          type="button"
          onClick={() => { if (urlInput.trim()) addByUrl.mutate(urlInput); }}
          disabled={addByUrl.isPending || !urlInput.trim()}
          className="shrink-0 px-3 py-2 border border-border/60 text-xs text-muted-foreground hover:text-gold hover:border-gold transition-colors disabled:opacity-40"
        >
          {addByUrl.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add URL"}
        </button>
      </div>
    </div>
  );
}

// ── Amenities editor ──────────────────────────────────────────────────────
const AMENITY_PRESETS = [
  { label: "Restrooms", icon: "🚻" },
  { label: "Wifi", icon: "📶" },
  { label: "Photography", icon: "📸" },
  { label: "Guided Tours", icon: "🧭" },
  { label: "Food Stalls", icon: "🍽️" },
  { label: "Camping", icon: "🏕️" },
  { label: "Wheelchair Access", icon: "♿" },
  { label: "Pet Friendly", icon: "🐕" },
  { label: "First Aid", icon: "🏥" },
  { label: "Lifeguard", icon: "🏊" },
];

function AmenitiesEditor({
  editing,
  setEditing,
}: {
  editing: Partial<Destination>;
  setEditing: React.Dispatch<React.SetStateAction<Partial<Destination> | null>>;
}) {
  const [input, setInput] = useState("");
  const tags: string[] = editing.amenities ?? [];

  const addTag = (label: string) => {
    const val = label.trim();
    if (!val || tags.includes(val)) return;
    setEditing((p) => ({ ...p!, amenities: [...(p?.amenities ?? []), val] }));
  };

  const removeTag = (val: string) => {
    setEditing((p) => ({ ...p!, amenities: (p?.amenities ?? []).filter((t) => t !== val) }));
  };

  const toggleBool = (key: "family_friendly" | "parking_available") => {
    setEditing((p) => ({ ...p!, [key]: !(p?.[key] ?? true) }));
  };

  return (
    <div className="border-t border-border/40 pt-4">
      <p className="mb-3 text-xs uppercase tracking-[0.15em] text-gold font-medium">Amenities</p>

      {/* Boolean toggles */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(
          [
            { key: "family_friendly", label: "Family Friendly", icon: "👨‍👩‍👧" },
            { key: "parking_available", label: "Parking Available", icon: "🅿️" },
          ] as const
        ).map(({ key, label, icon }) => {
          const active = (editing[key] ?? true) as boolean;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleBool(key)}
              className={[
                "flex items-center gap-2.5 px-3 py-2.5 border text-left transition-colors w-full",
                active ? "border-gold/50 bg-gold/10 text-gold" : "border-border/40 bg-surface text-muted-foreground",
              ].join(" ")}
            >
              <span className="text-lg">{icon}</span>
              <span className="text-xs font-medium flex-1">{label}</span>
              <span className={["text-[10px] font-bold tracking-[0.1em]", active ? "text-gold" : "text-muted-foreground/30"].join(" ")}>
                {active ? "YES" : "NO"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom tag input */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-border/60 px-3 py-2 focus-within:border-gold transition-colors">
          <Tag className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            placeholder="Add amenity (e.g. Lockers, Ticket Counter…)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addTag(input); setInput(""); }
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => { addTag(input); setInput(""); }}
          disabled={!input.trim()}
          className="shrink-0 px-3 py-2 border border-border/60 text-xs text-muted-foreground hover:text-gold hover:border-gold transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {AMENITY_PRESETS.map((p) => {
          const already = tags.includes(p.label);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => already ? removeTag(p.label) : addTag(p.label)}
              className={[
                "inline-flex items-center gap-1 px-2 py-1 text-[11px] border transition-colors",
                already
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-border/40 bg-surface text-muted-foreground hover:border-gold/40 hover:text-foreground",
              ].join(" ")}
            >
              {p.icon} {p.label}
            </button>
          );
        })}
      </div>

      {/* Current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-surface/50 border border-border/40">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/15 border border-gold/30 text-gold text-[11px]"
            >
              {t}
              <button type="button" onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors ml-0.5">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Travel Tips editor ────────────────────────────────────────────────────
const TIP_PRESETS: TravelTip[] = [
  { icon: "🌅", label: "Best Time", tip: "Arrive early morning for cooler temperatures and fewer crowds." },
  { icon: "🎒", label: "What to Carry", tip: "Water, light snacks, and sun protection. Comfortable walking shoes essential." },
  { icon: "📸", label: "Photography", tip: "Photography is permitted at most sites. Golden hour light is spectacular." },
  { icon: "🌧️", label: "Weather", tip: "Check weather forecasts before visiting — Wayanad sees heavy monsoon rainfall June–September." },
  { icon: "🚗", label: "Getting There", tip: "Best reached by private vehicle. Local autos and taxis available from Kalpetta." },
  { icon: "🌿", label: "Local Tips", tip: "Respect wildlife areas and tribal zones. Stay on marked trails at all times." },
];

function TravelTipsEditor({
  editing,
  setEditing,
}: {
  editing: Partial<Destination>;
  setEditing: React.Dispatch<React.SetStateAction<Partial<Destination> | null>>;
}) {
  const tips: TravelTip[] = editing.travel_tips ?? [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TravelTip>({ icon: "📌", label: "", tip: "" });

  const addTip = (t: TravelTip) => {
    const trimmed = { icon: t.icon.trim() || "📌", label: t.label.trim(), tip: t.tip.trim() };
    if (!trimmed.label) return;
    setEditing((p) => ({ ...p!, travel_tips: [...(p?.travel_tips ?? []), trimmed] }));
  };

  const removeTip = (idx: number) => {
    setEditing((p) => ({ ...p!, travel_tips: (p?.travel_tips ?? []).filter((_, i) => i !== idx) }));
  };

  return (
    <div className="border-t border-border/40 pt-4">
      <p className="mb-3 text-xs uppercase tracking-[0.15em] text-gold font-medium">Travel Tips</p>

      {tips.length > 0 && (
        <div className="space-y-2 mb-4">
          {tips.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-surface/50 border border-border/40">
              <span className="text-xl shrink-0 leading-none mt-0.5">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.tip}</p>
              </div>
              <button
                type="button"
                onClick={() => removeTip(i)}
                className="shrink-0 p-1 text-muted-foreground/40 hover:text-red-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preset quick-add chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {TIP_PRESETS.map((p) => {
          const already = tips.some((t) => t.label === p.label);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => !already && addTip(p)}
              disabled={already}
              className={[
                "inline-flex items-center gap-1 px-2 py-1 text-[11px] border transition-colors",
                already
                  ? "border-gold/30 bg-gold/5 text-gold/40 cursor-not-allowed"
                  : "border-border/40 bg-surface text-muted-foreground hover:border-gold/40 hover:text-foreground",
              ].join(" ")}
            >
              {p.icon} {p.label}
            </button>
          );
        })}
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-[11px] text-muted-foreground/60 hover:text-gold underline transition-colors"
        >
          + Add custom tip
        </button>
      ) : (
        <div className="border border-border/40 p-3 space-y-2 bg-surface/30">
          <div className="flex gap-2">
            <input
              className={inp + " w-16 text-center"}
              placeholder="🏷️"
              maxLength={4}
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            />
            <input
              className={inp + " flex-1"}
              placeholder="Label (e.g. Entry Fees)"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <textarea
            className={ta + " !min-h-[60px]"}
            placeholder="Tip text…"
            rows={2}
            value={form.tip}
            onChange={(e) => setForm((f) => ({ ...f, tip: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { addTip(form); setForm({ icon: "📌", label: "", tip: "" }); setShowForm(false); }}
              disabled={!form.label.trim()}
              className="px-3 py-1.5 bg-gold text-gold-foreground text-xs uppercase tracking-[0.1em] disabled:opacity-40"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm({ icon: "📌", label: "", tip: "" }); }}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminExplorePage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Destination> | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const destinations = useQuery({
    queryKey: ["admin_destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*, destination_categories(name,slug,icon), destination_images(id,image_url,sort_order)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (Destination & {
        destination_categories: { name: string; slug: string; icon: string } | null;
        destination_images: DestinationImage[];
      })[];
    },
    retry: false,
  });

  const categories = useQuery({
    queryKey: ["dest_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destination_categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as DestinationCategory[];
    },
    retry: false,
  });

  const save = useMutation({
    mutationFn: async (d: Partial<Destination>) => {
      const basePayload = {
        title: d.title?.trim() ?? "",
        slug: d.slug?.trim() || slugify(d.title ?? ""),
        short_description: d.short_description?.trim() ?? "",
        description: d.description?.trim() || null,
        category_id: d.category_id || null,
        featured_image: d.featured_image || null,
        google_maps_url: d.google_maps_url?.trim() || null,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
        distance_km: d.distance_km ?? null,
        travel_time: d.travel_time?.trim() || null,
        entry_fee: d.entry_fee?.trim() || null,
        best_time: d.best_time?.trim() || null,
        best_season: d.best_season?.trim() || null,
        opening_hours: d.opening_hours?.trim() || null,
        difficulty_level: d.difficulty_level?.trim() || null,
        family_friendly: d.family_friendly ?? true,
        parking_available: d.parking_available ?? true,
        featured: d.featured ?? false,
        google_rating: d.google_rating ?? null,
        seo_title: d.seo_title?.trim() || null,
        seo_description: d.seo_description?.trim() || null,
        status: d.status ?? "draft",
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tryPayload = async (payload: any) => {
        if (d.id) {
          const { error } = await supabase.from("destinations").update(payload).eq("id", d.id);
          return error;
        } else {
          const { data: inserted, error } = await supabase
            .from("destinations").insert(payload).select("id").single();
          if (!error) setEditing((prev) => (prev ? { ...prev, id: inserted.id } : prev));
          return error;
        }
      };

      // Try with all new columns first, fall back gracefully if migration hasn't run
      let err = await tryPayload({
        ...basePayload,
        amenities: d.amenities ?? [],
        travel_tips: d.travel_tips ?? [],
      });
      if (err) {
        const isSchemaMiss = err.message.includes("schema cache");
        if (isSchemaMiss) {
          err = await tryPayload({ ...basePayload, amenities: d.amenities ?? [] });
          if (!err) {
            toast.warning("Saved (without travel tips). Run the migration SQL to enable all features.", { duration: 6000 });
            return;
          }
        }
        if (isSchemaMiss || err.message.includes("amenities")) {
          err = await tryPayload(basePayload);
          if (!err) {
            toast.warning("Saved (without amenities/travel tips). Run the migration SQL to enable all features.", { duration: 6000 });
            return;
          }
        }
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_destinations"] });
      toast.success(editing?.id ? "Saved" : "Destination created — add gallery photos below");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("destinations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_destinations"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("destinations")
        .update({ status: status === "published" ? "draft" : "published" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_destinations"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("destinations").update({ featured: !featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_destinations"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    try {
      const { url } = await uploadImage(BUCKET, file, "covers");
      setEditing((prev) => (prev ? { ...prev, featured_image: url } : prev));
      toast.success("Cover uploaded");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setCoverUploading(false);
    }
  };

  useEffect(() => {
    if (editing === null) return;
    // Lock html, body, and the admin <main> element (actual scroll container in the layout)
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const main = document.querySelector("main") as HTMLElement | null;
    if (main) main.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      if (main) main.style.overflow = "";
    };
  }, [editing]);

  const list = destinations.data ?? [];
  const isSetupError = destinations.isError;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Explore Wayanad</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage tourist destinations shown on /explore</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          disabled={isSetupError}
          className="inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" /> Add Destination
        </button>
      </div>

      {isSetupError && <SetupBanner error={destinations.error} />}

      {destinations.isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
      ) : !isSetupError && list.length === 0 ? (
        <div className="rounded border border-border/60 bg-bg-secondary p-16 text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">No destinations yet — add your first one!</p>
        </div>
      ) : !isSetupError ? (
        <div className="overflow-x-auto rounded border border-border/60">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-bg-secondary text-left">
              <tr>
                {["Destination", "Category", "Distance", "Photos", "Status", "Featured", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {list.map((d) => {
                const photoCount = d.destination_images?.length ?? 0;
                return (
                  <tr key={d.id} className="bg-background hover:bg-bg-secondary transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {d.featured_image ? (
                          <img src={d.featured_image} alt={d.title} className="h-10 w-14 rounded object-cover shrink-0" />
                        ) : (
                          <div className="h-10 w-14 rounded bg-surface shrink-0 flex items-center justify-center">
                            <ImagePlus className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{d.title}</p>
                          <p className="text-xs text-muted-foreground">/explore/{d.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.destination_categories ? `${d.destination_categories.icon} ${d.destination_categories.name}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.distance_km != null ? `${d.distance_km} km` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={photoCount > 0 ? "text-xs font-medium text-gold" : "text-xs text-muted-foreground/40"}>
                        {photoCount > 0 ? `📷 ${photoCount}` : "No photos"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus.mutate({ id: d.id, status: d.status })}
                        className={["inline-flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-[0.1em]",
                          d.status === "published" ? "bg-green-900/30 text-green-400" : "bg-surface text-muted-foreground"
                        ].join(" ")}
                      >
                        {d.status === "published" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {d.status}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleFeatured.mutate({ id: d.id, featured: d.featured })}
                        className={d.featured ? "text-gold" : "text-muted-foreground/40"}
                        title={d.featured ? "Remove from featured" : "Mark as featured"}
                      >
                        <Star className="h-4 w-4" fill={d.featured ? "currentColor" : "none"} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setEditing(d)} className="p-1.5 text-muted-foreground hover:text-gold transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete "${d.title}"?`)) remove.mutate(d.id); }}
                          className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* ── Modal (portal → body, so wheel events can't reach admin <main>) ── */}
      {editing !== null && createPortal(
        /* Backdrop — clicking outside closes */
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setEditing(null)}
        >
          {/*
            Modal card:
            - max-h-[90vh] caps height at 90% of viewport
            - flex flex-col: header + scrollable-content + footer stack vertically
            - header (shrink-0) always visible at top
            - footer (shrink-0) always visible at bottom
            - content (flex-1 overflow-y-auto) scrolls between them
          */}
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-background border border-border/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 border-b border-border/60 px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">
                {editing.id ? "Edit Destination" : "Add Destination"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
            </div>

            {/* Scrollable body — min-h-0 lets flex-1 shrink below content height so overflow-y-auto actually bounds it */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-6 space-y-5">

              {/* Basic */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Title *">
                  <input
                    className={inp}
                    value={editing.title ?? ""}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditing((p) => ({ ...p!, title, slug: p?.id ? p.slug : slugify(title) }));
                    }}
                  />
                </Field>
                <Field label="Slug *">
                  <input
                    className={inp}
                    value={editing.slug ?? ""}
                    onChange={(e) => setEditing((p) => ({ ...p!, slug: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Short Description *">
                <input
                  className={inp}
                  value={editing.short_description ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p!, short_description: e.target.value }))}
                />
              </Field>

              <Field label="Full Description">
                <textarea
                  className={ta}
                  rows={5}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p!, description: e.target.value }))}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select
                    className={inp}
                    value={editing.category_id ?? ""}
                    onChange={(e) => setEditing((p) => ({ ...p!, category_id: e.target.value || null }))}
                  >
                    <option value="">— None —</option>
                    {(categories.data ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    className={inp}
                    value={editing.status ?? "draft"}
                    onChange={(e) => setEditing((p) => ({ ...p!, status: e.target.value as "published" | "draft" }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </Field>
              </div>

              {/* ── Cover Image ── */}
              <div className="border-t border-border/40 pt-4">
                <p className="mb-3 text-xs uppercase tracking-[0.15em] text-gold font-medium">Cover Image</p>
                <div className="flex gap-3 items-start">
                  <input
                    className={inp + " flex-1"}
                    placeholder="https://…"
                    value={editing.featured_image ?? ""}
                    onChange={(e) => setEditing((p) => ({ ...p!, featured_image: e.target.value || null }))}
                  />
                  <label className="shrink-0 cursor-pointer inline-flex items-center gap-2 border border-border/60 px-3 py-2 text-xs text-muted-foreground hover:text-gold hover:border-gold transition-colors">
                    {coverUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Upload"}
                    <input
                      type="file" accept="image/*" className="sr-only"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }}
                    />
                  </label>
                </div>
                {editing.featured_image && (
                  <div className="mt-2 relative inline-block">
                    <img src={editing.featured_image} alt="cover" className="h-28 rounded object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditing((p) => ({ ...p!, featured_image: null }))}
                      className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Gallery Photos ── */}
              {editing.id ? (
                <GalleryManager destId={editing.id} />
              ) : (
                <div className="border-t border-border/40 pt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-gold font-medium">Gallery Photos</p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="aspect-video rounded border-2 border-dashed border-border/30 flex flex-col items-center justify-center gap-1">
                        <ImagePlus className="h-5 w-5 text-muted-foreground/20" />
                        <span className="text-[10px] text-muted-foreground/30">Photo {n}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/60">Save the destination first, then add photos here.</p>
                </div>
              )}

              {/* ── Amenities ── */}
              <AmenitiesEditor editing={editing} setEditing={setEditing} />

              {/* ── Travel Tips ── */}
              <TravelTipsEditor editing={editing} setEditing={setEditing} />

              {/* ── Location ── */}
              <div className="border-t border-border/40 pt-4">
                <p className="mb-3 text-xs uppercase tracking-[0.15em] text-gold font-medium">Location</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Distance from Veycho (km)">
                    <input
                      type="number" className={inp} value={editing.distance_km ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, distance_km: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </Field>
                  <Field label="Travel Time">
                    <input
                      className={inp} placeholder="e.g. 30 mins" value={editing.travel_time ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, travel_time: e.target.value }))}
                    />
                  </Field>
                  <Field label="Latitude">
                    <input
                      type="number" step="0.0001" className={inp} value={editing.latitude ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, latitude: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </Field>
                  <Field label="Longitude">
                    <input
                      type="number" step="0.0001" className={inp} value={editing.longitude ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, longitude: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </Field>
                </div>
                <Field label="Google Maps URL">
                  <input
                    className={inp + " mt-3"} placeholder="https://maps.google.com/…" value={editing.google_maps_url ?? ""}
                    onChange={(e) => setEditing((p) => ({ ...p!, google_maps_url: e.target.value }))}
                  />
                </Field>
              </div>

              {/* ── Practical Info ── */}
              <div className="border-t border-border/40 pt-4">
                <p className="mb-3 text-xs uppercase tracking-[0.15em] text-gold font-medium">Practical Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Entry Fee">
                    <input
                      className={inp} placeholder="e.g. ₹40 per person" value={editing.entry_fee ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, entry_fee: e.target.value }))}
                    />
                  </Field>
                  <Field label="Opening Hours">
                    <input
                      className={inp} placeholder="e.g. 9 AM – 5 PM" value={editing.opening_hours ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, opening_hours: e.target.value }))}
                    />
                  </Field>
                  <Field label="Best Time to Visit">
                    <input
                      className={inp} placeholder="e.g. 8 AM – 4 PM" value={editing.best_time ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, best_time: e.target.value }))}
                    />
                  </Field>
                  <Field label="Best Season">
                    <input
                      className={inp} placeholder="e.g. October to May" value={editing.best_season ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, best_season: e.target.value }))}
                    />
                  </Field>
                  <Field label="Difficulty Level">
                    <select
                      className={inp} value={editing.difficulty_level ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, difficulty_level: e.target.value || null }))}
                    >
                      <option value="">— Select —</option>
                      <option>Easy</option>
                      <option>Easy to Moderate</option>
                      <option>Moderate</option>
                      <option>Moderate to Difficult</option>
                      <option>Difficult</option>
                      <option>Easy (Safari)</option>
                    </select>
                  </Field>
                  <Field label="Google Rating (0–5)">
                    <input
                      type="number" min="0" max="5" step="0.1" className={inp} value={editing.google_rating ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, google_rating: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={(editing.featured ?? false) as boolean}
                      onChange={(e) => setEditing((p) => ({ ...p!, featured: e.target.checked }))}
                      className="accent-gold"
                    />
                    Featured on Homepage
                  </label>
                </div>
              </div>

              {/* ── SEO ── */}
              <div className="border-t border-border/40 pt-4">
                <p className="mb-3 text-xs uppercase tracking-[0.15em] text-gold font-medium">SEO</p>
                <div className="space-y-3">
                  <Field label="SEO Title">
                    <input
                      className={inp} value={editing.seo_title ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, seo_title: e.target.value }))}
                    />
                  </Field>
                  <Field label="SEO Description">
                    <textarea
                      className={ta} rows={2} value={editing.seo_description ?? ""}
                      onChange={(e) => setEditing((p) => ({ ...p!, seo_description: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>

            </div>{/* end scrollable body */}

            {/* Footer — always visible */}
            <div className="shrink-0 border-t border-border/60 px-6 py-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground/60">
                {editing.id ? "Changes are live after saving." : "Gallery photos can be added after first save."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
                <button
                  onClick={() => save.mutate(editing)}
                  disabled={save.isPending || !editing.title?.trim()}
                  className="inline-flex items-center gap-2 bg-gold px-5 py-2 text-xs uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-50"
                >
                  {save.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {editing.id ? "Save Changes" : "Create"}
                </button>
              </div>
            </div>

          </div>{/* end modal card */}
        </div>,
        document.body
      )}
    </div>
  );
}
