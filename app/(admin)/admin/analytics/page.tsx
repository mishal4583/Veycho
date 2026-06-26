"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { supabase } from "@/lib/supabase/client";
import { bucketByDay } from "@/lib/analytics-utils";
import { rangeDays } from "@/lib/analytics-utils";
import { TrendingUp, TrendingDown, Eye, MessageCircle, FileText, Activity } from "lucide-react";

type Range = 7 | 30 | 90;

export default function AnalyticsAdmin() {
  const [range, setRange] = useState<Range>(30);
  const { sinceISO } = useMemo(() => rangeDays(range), [range]);

  const analyticsQ = useQuery({
    queryKey: ["adm-analytics", range],
    queryFn: async () => {
      const { data } = await supabase
        .from("analytics")
        .select("event_type, page, created_at")
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: false })
        .limit(1000);
      return data ?? [];
    },
  });

  const chatsQ = useQuery({
    queryKey: ["adm-chats", range],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_logs")
        .select("id, created_at")
        .gte("created_at", sinceISO)
        .limit(1000);
      return data ?? [];
    },
  });

  const events = analyticsQ.data ?? [];
  const chats = chatsQ.data ?? [];

  // KPIs
  const pageViews = events.filter((e) => e.event_type === "page_view").length;
  const conversations = chats.length;
  const uniquePages = new Set(events.filter((e) => e.event_type === "page_view").map((e) => e.page)).size;
  const totalEvents = events.length;

  // Series
  const viewsSeries = useMemo(
    () => bucketByDay(events.filter((e) => e.event_type === "page_view"), (e) => e.created_at as string, range),
    [events, range],
  );
  const chatSeries = useMemo(
    () => bucketByDay(chats, (c) => c.created_at as string, Math.min(range, 14)),
    [chats, range],
  );

  // Top events
  const eventCounts: Record<string, number> = {};
  events.forEach((e) => { eventCounts[e.event_type] = (eventCounts[e.event_type] ?? 0) + 1; });
  const topEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name: name.replace(/_/g, " "), count }));

  // Top pages
  const pageCounts: Record<string, number> = {};
  events.filter((e) => e.event_type === "page_view").forEach((e) => {
    const p = (e.page as string) ?? "/";
    pageCounts[p] = (pageCounts[p] ?? 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([page, count]) => ({ page, count }));

  const loading = analyticsQ.isLoading || chatsQ.isLoading;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1 className="mt-2 font-serif text-3xl text-foreground">Engagement</h1>
          <p className="mt-2 text-sm text-muted-foreground">Live view of guest behaviour and concierge activity.</p>
        </div>
        <div className="flex gap-1 border border-border/60 bg-bg-secondary">
          {([7, 30, 90] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                range === r ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Eye} label="Page views" value={pageViews} hint={`${range}-day window`} />
        <Kpi icon={MessageCircle} label="AI conversations" value={conversations} hint={`${range}-day window`} />
        <Kpi icon={FileText} label="Unique pages" value={uniquePages} hint="distinct pages viewed" />
        <Kpi icon={Activity} label="Total events" value={totalEvents} hint={`${range}-day window`} />
      </div>

      {loading && <p className="mt-6 text-xs text-muted-foreground">Loading data…</p>}

      {/* Visitor trend */}
      <Section title="Visitor trend" subtitle={`Page views per day · last ${range} days`}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={viewsSeries} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#edb63f" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#edb63f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" stroke="#7a7d83" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7a7d83" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="count" stroke="#edb63f" strokeWidth={2} fill="url(#goldFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Top events" subtitle="Most-fired events">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topEvents} layout="vertical" margin={{ left: 20, right: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#7a7d83" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#9ea1a8" fontSize={11} tickLine={false} axisLine={false} width={120} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#edb63f" />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Top pages" subtitle="By page view">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topPages} layout="vertical" margin={{ left: 20, right: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#7a7d83" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="page" stroke="#9ea1a8" fontSize={11} tickLine={false} axisLine={false} width={120} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#c79233" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Concierge activity" subtitle={`AI conversations per day · last ${Math.min(range, 14)} days`}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chatSeries} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" stroke="#7a7d83" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7a7d83" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#edb63f" strokeWidth={2} dot={{ r: 3, fill: "#edb63f" }} />
          </LineChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "#0b212b",
    border: "1px solid rgba(212,168,75,0.3)",
    borderRadius: 0,
    fontSize: 12,
  } as const,
  labelStyle: { color: "#edb63f", fontWeight: 500 } as const,
  itemStyle: { color: "#f4ead6" } as const,
};

function Kpi({
  icon: Icon, label, value, hint, delta,
}: { icon: any; label: string; value: number | string; hint?: string; delta?: number }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="border-gold-hairline bg-bg-secondary p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow-muted">{label}</p>
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <p className="mt-3 font-serif text-3xl text-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        {typeof delta === "number" && (
          <span className={`inline-flex items-center gap-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

function Section({
  title, subtitle, action, children,
}: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-6 border border-border/60 bg-bg-secondary p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg text-foreground">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
