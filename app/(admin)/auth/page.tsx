"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin");
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        router.replace("/admin");
        router.refresh();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin", data: { name } },
        });
        if (error) throw error;
        toast.success("Account created");
        router.replace("/admin");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Magic link sent — check your email");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md border-gold-hairline bg-bg-secondary p-8">
        <a href="/" className="eyebrow text-gold">← Back to site</a>
        <h1 className="mt-6 font-serif text-3xl text-foreground">
          Veycho <span className="italic text-gold">Admin</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" && "Sign in to manage Veycho Wayanad."}
          {mode === "signup" && "Create your admin account."}
          {mode === "magic" && "We'll email you a one-time sign-in link."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <input
              required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full bg-surface border border-border/60 px-4 py-3 text-sm text-foreground focus:border-gold/60 focus:outline-none"
            />
          )}
          <input
            required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-surface border border-border/60 px-4 py-3 text-sm text-foreground focus:border-gold/60 focus:outline-none"
          />
          {mode !== "magic" && (
            <input
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" minLength={8}
              className="w-full bg-surface border border-border/60 px-4 py-3 text-sm text-foreground focus:border-gold/60 focus:outline-none"
            />
          )}
          <button
            type="submit" disabled={loading}
            className="w-full bg-gold py-3 text-xs uppercase tracking-[0.3em] text-gold-foreground hover:bg-gold-bright transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" && "Sign in"}
            {mode === "signup" && "Create account"}
            {mode === "magic" && "Send magic link"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center text-xs text-muted-foreground">
          {mode !== "signin" && <button onClick={() => setMode("signin")} className="hover:text-gold">Have an account? Sign in</button>}
          {mode !== "signup" && <button onClick={() => setMode("signup")} className="hover:text-gold">Need an account? Sign up</button>}
          {mode !== "magic" && <button onClick={() => setMode("magic")} className="hover:text-gold">Use a magic link instead</button>}
        </div>
      </div>
    </main>
  );
}
