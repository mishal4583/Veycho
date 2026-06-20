"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";

type Faq = { id?: string; question: string; answer: string; category: string | null; sort_order?: number };
const EMPTY: Faq = { question: "", answer: "", category: "" };

export default function FaqsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Faq | null>(null);
  const list = useQuery({ queryKey: ["faqs_admin"], queryFn: async () => (await supabase.from("faqs").select("*").order("sort_order")).data ?? [] });

  const save = useMutation({
    mutationFn: async (faq: Faq) => {
      const payload = { question: faq.question, answer: faq.answer, category: faq.category || null };
      if (faq.id) {
        const { error } = await supabase.from("faqs").update(payload).eq("id", faq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("faqs").insert({ ...payload, sort_order: (list.data?.length ?? 0) + 1 });
        if (error) throw error;
      }
    },
    onSuccess: (_d, faq) => { qc.invalidateQueries({ queryKey: ["faqs_admin"] }); setEditing(null); toast.success(faq.id ? "Saved — AI knowledge updated" : "Added — AI knowledge updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("faqs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faqs_admin"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <header className="mb-6 flex items-center justify-between"><div><p className="eyebrow">AI Knowledge</p><h1 className="mt-2 font-serif text-3xl">FAQs & policies</h1>
        <p className="text-sm text-muted-foreground mt-2">These entries feed the Veycho AI concierge.</p>
      </div>
        <button onClick={() => setEditing(EMPTY)} className="inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-gold-foreground"><Plus className="h-4 w-4" /> New</button>
      </header>
      <ul className="border border-border/60 bg-bg-secondary divide-y divide-border/30">
        {(list.data ?? []).map((f: any) => (
          <li key={f.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-foreground">{f.question}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.answer}</div>
              {f.category && <span className="inline-block mt-2 text-[10px] uppercase tracking-[0.2em] text-gold">{f.category}</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditing(f)} className="p-2 text-muted-foreground hover:text-gold"><Edit className="h-4 w-4" /></button>
              <button onClick={() => confirm("Delete?") && del.mutate(f.id)} className="p-2 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
        {!(list.data ?? []).length && <li className="p-8 text-center text-muted-foreground">No FAQs</li>}
      </ul>
      {editing && <FaqModal faq={editing} onClose={() => setEditing(null)} onSave={(f) => save.mutate(f)} saving={save.isPending} />}
    </div>
  );
}

function FaqModal({ faq, onClose, onSave, saving }: { faq: Faq; onClose: () => void; onSave: (f: Faq) => void; saving: boolean }) {
  const [f, setF] = useState<Faq>(faq);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4" onClick={onClose}>
      <div className="bg-bg-secondary border-gold-hairline w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-4">{f.id ? "Edit FAQ" : "New FAQ"}</h2>
        <div className="space-y-3">
          <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Question" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />
          <textarea rows={4} className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Answer" value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} />
          <input className="w-full bg-surface border border-border/60 px-3 py-2 text-sm" placeholder="Category (optional)" value={f.category ?? ""} onChange={(e) => setF({ ...f, category: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-muted-foreground">Cancel</button>
          <button onClick={() => onSave(f)} disabled={saving} className="inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-gold-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
        </div>
      </div>
    </div>
  );
}
