"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

const ROLES = ["super_admin", "manager", "content_editor"] as const;

export default function UsersAdmin() {
  const qc = useQueryClient();
  const data = useQuery({
    queryKey: ["users_admin"],
    queryFn: async () => {
      const profiles = (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [];
      const roles = (await supabase.from("user_roles").select("*")).data ?? [];
      return profiles.map((p: any) => ({ ...p, roles: roles.filter((r: any) => r.user_id === p.id).map((r: any) => r.role) }));
    },
  });

  const grant = useMutation({
    mutationFn: async ({ user_id, role }: any) => { const { error } = await supabase.from("user_roles").insert({ user_id, role }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users_admin"] }); toast.success("Role granted"); },
    onError: (e: any) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: async ({ user_id, role }: any) => { const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users_admin"] }); toast.success("Role revoked"); },
  });

  return (
    <div>
      <header className="mb-6"><p className="eyebrow">Users</p><h1 className="mt-2 font-serif text-3xl">Team access</h1></header>
      <ul className="border border-border/60 bg-bg-secondary divide-y divide-border/30">
        {(data.data ?? []).map((u: any) => (
          <li key={u.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div><div className="text-foreground">{u.name ?? u.email}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const has = u.roles.includes(r);
                return (
                  <button key={r} onClick={() => has ? revoke.mutate({ user_id: u.id, role: r }) : grant.mutate({ user_id: u.id, role: r })}
                    className={["px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border",
                      has ? "bg-gold text-gold-foreground border-gold" : "border-border/60 text-muted-foreground hover:border-gold/60"].join(" ")}>
                    {r.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
        {!data.data?.length && <li className="p-6 text-center text-muted-foreground text-sm">No users yet</li>}
      </ul>
    </div>
  );
}
