"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SpecialsAdmin() {
  const qc = useQueryClient();
  const items = useQuery({ queryKey: ["menu_items_all"], queryFn: async () => (await supabase.from("menu_items").select("*").order("name")).data ?? [] });

  const toggle = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("menu_items").update({ is_chef_special: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items_all"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <header className="mb-6"><p className="eyebrow">Chef Specials</p><h1 className="mt-2 font-serif text-3xl">Feature on homepage</h1>
        <p className="text-sm text-muted-foreground mt-2">Toggle items to feature them in tonight's specials section.</p>
      </header>
      <ul className="border border-border/60 bg-bg-secondary divide-y divide-border/30">
        {(items.data ?? []).map((m: any) => (
          <li key={m.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {m.image_url && <img src={m.image_url} alt="" className="h-12 w-12 object-cover" />}
              <div><div className="text-foreground">{m.name}</div><div className="text-xs text-gold">₹{m.price}</div></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={m.is_chef_special} onChange={(e) => toggle.mutate({ id: m.id, value: e.target.checked })} />
              Featured
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
