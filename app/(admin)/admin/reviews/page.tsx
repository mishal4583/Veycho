"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Star, Check } from "lucide-react";

export default function ReviewsAdmin() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["reviews_admin"], queryFn: async () => (await supabase.from("reviews").select("*").order("created_at", { ascending: false })).data ?? [] });

  const update = useMutation({
    mutationFn: async (p: { id: string; patch: any }) => { const { error } = await supabase.from("reviews").update(p.patch).eq("id", p.id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reviews_admin"] }); toast.success("Updated"); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("reviews").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews_admin"] }),
  });

  return (
    <div>
      <header className="mb-6"><p className="eyebrow">Reviews</p><h1 className="mt-2 font-serif text-3xl">Moderation</h1></header>
      <ul className="border border-border/60 bg-bg-secondary divide-y divide-border/30">
        {(list.data ?? []).map((r: any) => (
          <li key={r.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-gold">{r.name} · {"★".repeat(r.rating)}</div>
                <p className="text-sm text-foreground/90 mt-1">{r.review_text}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()} · {r.approved ? "Approved" : "Pending"}{r.featured && " · Featured"}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => update.mutate({ id: r.id, patch: { approved: !r.approved } })} className={"p-2 " + (r.approved ? "text-emerald-400" : "text-muted-foreground hover:text-emerald-400")}><Check className="h-4 w-4" /></button>
                <button onClick={() => update.mutate({ id: r.id, patch: { featured: !r.featured } })} className={"p-2 " + (r.featured ? "text-gold" : "text-muted-foreground hover:text-gold")}><Star className="h-4 w-4" /></button>
                <button onClick={() => confirm("Delete?") && del.mutate(r.id)} className="p-2 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
