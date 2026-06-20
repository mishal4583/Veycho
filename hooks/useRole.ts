import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type Role = "super_admin" | "manager" | "content_editor";

export function useRoles() {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setRoles([]);
      setUserId(null);
      setLoading(false);
      return;
    }
    setUserId(u.user.id);

    // Ensure a profile row exists for this user (RLS scopes it to id = auth.uid()).
    await supabase.from("profiles").upsert(
      {
        id: u.user.id,
        email: u.user.email,
        name:
          (u.user.user_metadata as any)?.name ??
          (u.user.user_metadata as any)?.full_name ??
          null,
        avatar_url: (u.user.user_metadata as any)?.avatar_url ?? null,
      },
      { onConflict: "id" },
    );

    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    setRoles((r ?? []).map((x: any) => x.role as Role));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // One-time owner bootstrap. Enforced server-side: claim_super_admin() only grants a
  // role when NO super_admin exists yet, so this is safe to expose as an explicit action.
  const claimOwner = useCallback(async () => {
    const { data: claimed, error } = await supabase.rpc("claim_super_admin");
    if (!error && claimed) {
      await load();
      return true;
    }
    return false;
  }, [load]);

  const has = (...allowed: Role[]) => roles?.some((r) => allowed.includes(r)) ?? false;
  return {
    roles,
    userId,
    loading,
    reload: load,
    claimOwner,
    isSuperAdmin: has("super_admin"),
    isManager: has("super_admin", "manager"),
    isEditor: has("super_admin", "manager", "content_editor"),
    has,
  };
}
