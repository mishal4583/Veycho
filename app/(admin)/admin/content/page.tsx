"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_CONTENT,
  type SiteContent,
  type JourneyChapter,
  type ExploreSectionContent,
  type ExplorePageContent,
} from "@/lib/content-defaults";
import type { Json } from "@/lib/supabase/types";

/* ============================================================
   Site Content editor — basic forms that write the editable copy + media
   for the public site into the `site_content` table (one row per block) and
   the `story` singleton (home paragraph + Journey chapters). Contact details
   and social links live on the Settings page; menu items + chef specials live
   on the Menu / Chef Specials pages.
   ============================================================ */

const input =
  "w-full bg-surface border border-border/60 px-3 py-2 text-sm rounded";
const labelCls = "block text-xs text-muted-foreground mb-1";

function FileButton({
  accept,
  onChange,
  label = "Choose file",
}: {
  accept?: string;
  onChange: (f: File) => void;
  label?: string;
}) {
  const [name, setName] = useState<string | null>(null);
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <span className="inline-flex items-center gap-1.5 bg-surface border border-border/60 hover:border-gold/60 hover:text-gold px-3 py-1.5 text-xs rounded transition-colors">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        {label}
      </span>
      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
        {name ?? "No file chosen"}
      </span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setName(f.name);
          onChange(f);
        }}
      />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  area,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {area ? (
        <textarea
          className={input}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={input}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border/60 bg-bg-secondary p-5 rounded-lg">
      <h2 className="font-serif text-xl text-foreground">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

type Form = {
  hero: SiteContent["hero"];
  promo: SiteContent["promo"];
  nav: SiteContent["nav"];
  storyParagraph: string;
  storyExtra: {
    ctaLabel: string;
    journeyLabel: string;
    journeySubtitle: string;
    journeyHintDesktop: string;
    journeyHintMobile: string;
  };
  chapters: JourneyChapter[];
  chefSpecials: SiteContent["chefSpecials"];
  reviews: SiteContent["reviews"];
  visit: { heading: string; ctaParagraph: string; mapBadge: string };
  footer: {
    brandName: string;
    description: string;
    explore: SiteContent["footer"]["explore"];
    copyright: string;
  };
  menuPage: SiteContent["menuPage"];
  galleryPage: SiteContent["galleryPage"];
  exploreSection: ExploreSectionContent;
  explorePage: ExplorePageContent;
};

const d = DEFAULT_CONTENT;

export default function SiteContentAdmin() {
  const [form, setForm] = useState<Form | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sc = useQuery({
    queryKey: ["site_content_admin"],
    queryFn: async () => {
      const [rows, story] = await Promise.all([
        supabase.from("site_content").select("section,data"),
        supabase.from("story").select("*").limit(1).maybeSingle(),
      ]);
      return { rows: rows.data ?? [], story: story.data ?? null };
    },
  });

  useEffect(() => {
    if (!sc.isFetched) return;
    const map: Record<string, Record<string, unknown>> = {};
    for (const r of (sc.data?.rows ?? []) as { section: string; data: Record<string, unknown> }[]) {
      map[r.section] = r.data ?? {};
    }
    const story = sc.data?.story as Record<string, unknown> | null;
    setStoryId((story?.id as string) ?? null);
    const g = <T,>(section: string, fallback: T): T =>
      ({ ...(fallback as object), ...(map[section] ?? {}) }) as T;

    setForm({
      hero: g("hero", d.hero),
      promo: g("promo", d.promo),
      nav: g("nav", d.nav),
      storyParagraph: (story?.content as string) ?? d.story.paragraph,
      storyExtra: g("story_extra", {
        ctaLabel: d.story.ctaLabel,
        journeyLabel: d.journey.label,
        journeySubtitle: d.journey.subtitle,
        journeyHintDesktop: d.journey.hintDesktop,
        journeyHintMobile: d.journey.hintMobile,
      }),
      chapters:
        (Array.isArray(story?.timeline_json) && (story?.timeline_json as JourneyChapter[]).length
          ? (story?.timeline_json as JourneyChapter[])
          : d.journey.chapters
        ).map((c) => ({ year: c.year ?? "", title: c.title ?? "", body: c.body ?? "" })),
      chefSpecials: g("chef_specials", d.chefSpecials),
      reviews: g("reviews", d.reviews),
      visit: g("visit", {
        heading: d.visit.heading,
        ctaParagraph: d.visit.ctaParagraph,
        mapBadge: d.visit.mapBadge,
      }),
      footer: g("footer", {
        brandName: d.footer.brandName,
        description: d.footer.description,
        explore: d.footer.explore,
        copyright: d.footer.copyright,
      }),
      menuPage: g("menu_page", d.menuPage),
      galleryPage: g("gallery_page", d.galleryPage),
      exploreSection: g("explore_section", d.exploreSection),
      explorePage: g("explore_page", d.explorePage),
    });
  }, [sc.isFetched, sc.data]);

  const patch = <K extends keyof Form>(key: K, val: Partial<Form[K]>) =>
    setForm((f) => (f ? { ...f, [key]: { ...(f[key] as object), ...val } } : f));

  async function uploadTo(file: File): Promise<string | null> {
    try {
      const { url } = await uploadImage("site-media", file);
      return url;
    } catch (e) {
      toast.error((e as Error).message);
      return null;
    }
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const rows = [
        { section: "hero", data: form.hero },
        { section: "promo", data: form.promo },
        { section: "nav", data: form.nav },
        { section: "story_extra", data: form.storyExtra },
        { section: "chef_specials", data: form.chefSpecials },
        { section: "reviews", data: form.reviews },
        { section: "visit", data: form.visit },
        { section: "footer", data: form.footer },
        { section: "menu_page", data: form.menuPage },
        { section: "gallery_page", data: form.galleryPage },
        { section: "explore_section", data: form.exploreSection },
        { section: "explore_page", data: form.explorePage },
      ] as unknown as { section: string; data: Json }[];

      const { error: scErr } = await supabase
        .from("site_content")
        .upsert(rows, { onConflict: "section" });
      if (scErr) throw scErr;

      const storyPayload = {
        content: form.storyParagraph,
        timeline_json: form.chapters as unknown as Json,
      };
      if (storyId) {
        const { error } = await supabase
          .from("story")
          .update(storyPayload)
          .eq("id", storyId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("story").insert(storyPayload);
        if (error) throw error;
      }
      toast.success("Saved — changes are live on the site.");
      sc.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!form)
    return <Loader2 className="h-6 w-6 animate-spin text-gold" />;

  return (
    <div className="max-w-3xl pb-24">
      <header className="mb-6">
        <p className="eyebrow">Site Content</p>
        <h1 className="mt-2 font-serif text-3xl">Edit the website</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Text, images and the hero video for the public site. Contact details &amp;
          social links are on <span className="text-gold">Settings</span>; dishes &amp;
          prices on <span className="text-gold">Menu</span>.
        </p>
      </header>

      <div className="space-y-5">
        <Card title="Hero" hint="The top of the home page — headline, tagline and the background video.">
          <Field label="Eyebrow label" value={form.hero.label} onChange={(v) => patch("hero", { label: v })} />
          <Field label="Title" value={form.hero.title} onChange={(v) => patch("hero", { title: v })} />
          <Field label="Tagline" value={form.hero.tagline} onChange={(v) => patch("hero", { tagline: v })} />
          <Field label="Spinning badge text" value={form.hero.badgeText} onChange={(v) => patch("hero", { badgeText: v })} />
          <div>
            <span className={labelCls}>Background video (mp4)</span>
            {form.hero.videoUrl && (
              <p className="mb-1 text-xs text-gold break-all">{form.hero.videoUrl}</p>
            )}
            <FileButton
              accept="video/*"
              label="Choose video"
              onChange={async (f) => {
                const url = await uploadTo(f);
                if (url) patch("hero", { videoUrl: url });
              }}
            />
          </div>
          <div>
            <span className={labelCls}>Poster image (shown before the video loads)</span>
            {form.hero.posterUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.hero.posterUrl} alt="" className="h-16 mb-2 object-contain" />
            )}
            <FileButton
              accept="image/*"
              label="Choose image"
              onChange={async (f) => {
                const url = await uploadTo(f);
                if (url) patch("hero", { posterUrl: url });
              }}
            />
          </div>
        </Card>

        <Card title="Promo bar" hint="The scrolling strip at the very top.">
          <Field label="Message" value={form.promo.message} area onChange={(v) => patch("promo", { message: v })} />
        </Card>

        <Card title="Navigation labels">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Menu button" value={form.nav.menuLabel} onChange={(v) => patch("nav", { menuLabel: v })} />
            <Field label="Explore button" value={form.nav.exploreLabel} onChange={(v) => patch("nav", { exploreLabel: v })} />
            <Field label="Gallery button" value={form.nav.galleryLabel} onChange={(v) => patch("nav", { galleryLabel: v })} />
            <Field label="Visit button" value={form.nav.visitLabel} onChange={(v) => patch("nav", { visitLabel: v })} />
          </div>
        </Card>

        <Card title="Story & Journey" hint="The home story paragraph, and the chapters in the fanned card deck.">
          <Field label="Story paragraph" value={form.storyParagraph} area onChange={(v) => setForm((f) => (f ? { ...f, storyParagraph: v } : f))} />
          <Field label="Story button label" value={form.storyExtra.ctaLabel} onChange={(v) => patch("storyExtra", { ctaLabel: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Journey eyebrow" value={form.storyExtra.journeyLabel} onChange={(v) => patch("storyExtra", { journeyLabel: v })} />
            <Field label="Journey heading" value={form.storyExtra.journeySubtitle} onChange={(v) => patch("storyExtra", { journeySubtitle: v })} />
          </div>
          <Field label="Hint (desktop)" value={form.storyExtra.journeyHintDesktop} onChange={(v) => patch("storyExtra", { journeyHintDesktop: v })} />
          <Field label="Hint (mobile)" value={form.storyExtra.journeyHintMobile} onChange={(v) => patch("storyExtra", { journeyHintMobile: v })} />

          <div className="pt-2 space-y-3">
            <span className={labelCls}>Chapters</span>
            {form.chapters.map((ch, i) => (
              <div key={i} className="border border-border/60 p-3 rounded space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className={input + " max-w-[120px]"}
                    placeholder="Year"
                    value={ch.year}
                    onChange={(e) => {
                      const next = [...form.chapters];
                      next[i] = { ...ch, year: e.target.value };
                      setForm((f) => (f ? { ...f, chapters: next } : f));
                    }}
                  />
                  <input
                    className={input}
                    placeholder="Title"
                    value={ch.title}
                    onChange={(e) => {
                      const next = [...form.chapters];
                      next[i] = { ...ch, title: e.target.value };
                      setForm((f) => (f ? { ...f, chapters: next } : f));
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Remove chapter"
                    className="text-muted-foreground hover:text-red-400 shrink-0"
                    onClick={() =>
                      setForm((f) =>
                        f ? { ...f, chapters: f.chapters.filter((_, j) => j !== i) } : f
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  className={input}
                  rows={3}
                  placeholder="Body"
                  value={ch.body}
                  onChange={(e) => {
                    const next = [...form.chapters];
                    next[i] = { ...ch, body: e.target.value };
                    setForm((f) => (f ? { ...f, chapters: next } : f));
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-2 border-gold-hairline px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold"
              onClick={() =>
                setForm((f) =>
                  f
                    ? { ...f, chapters: [...f.chapters, { year: "", title: "", body: "" }] }
                    : f
                )
              }
            >
              <Plus className="h-4 w-4" /> Add chapter
            </button>
          </div>
        </Card>

        <Card title="Chef's Specials (intro)" hint="The dishes themselves are managed on the Chef Specials page.">
          <Field label="Eyebrow" value={form.chefSpecials.label} onChange={(v) => patch("chefSpecials", { label: v })} />
          <Field label="Heading" value={form.chefSpecials.heading} onChange={(v) => patch("chefSpecials", { heading: v })} />
          <Field label="Description" value={form.chefSpecials.description} area onChange={(v) => patch("chefSpecials", { description: v })} />
          <Field label="CTA card heading" value={form.chefSpecials.ctaHeading} area onChange={(v) => patch("chefSpecials", { ctaHeading: v })} />
          <Field label="CTA card description" value={form.chefSpecials.ctaDesc} onChange={(v) => patch("chefSpecials", { ctaDesc: v })} />
        </Card>

        <Card title="Reviews (intro)" hint="Live Google reviews fill the cards automatically.">
          <Field label="Heading" value={form.reviews.heading} onChange={(v) => patch("reviews", { heading: v })} />
          <Field label="Rating badge" value={form.reviews.ratingBadge} onChange={(v) => patch("reviews", { ratingBadge: v })} />
        </Card>

        <Card title="Visit (text)" hint="Phone, hours, address, map link & socials are on the Settings page.">
          <Field label="Heading (use new lines for stacking)" value={form.visit.heading} area onChange={(v) => patch("visit", { heading: v })} />
          <Field label="Paragraph" value={form.visit.ctaParagraph} area onChange={(v) => patch("visit", { ctaParagraph: v })} />
          <Field label="Map badge" value={form.visit.mapBadge} onChange={(v) => patch("visit", { mapBadge: v })} />
        </Card>

        <Card title="Footer">
          <Field label="Brand name" value={form.footer.brandName} onChange={(v) => patch("footer", { brandName: v })} />
          <Field label="Description" value={form.footer.description} area onChange={(v) => patch("footer", { description: v })} />
          <Field label="Copyright line" value={form.footer.copyright} onChange={(v) => patch("footer", { copyright: v })} />
        </Card>

        <Card title="Menu page (text)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hero eyebrow" value={form.menuPage.heroLabel} onChange={(v) => patch("menuPage", { heroLabel: v })} />
            <Field label="Hero title" value={form.menuPage.heroTitle} onChange={(v) => patch("menuPage", { heroTitle: v })} />
          </div>
          <Field label="Hero tagline" value={form.menuPage.heroTagline} onChange={(v) => patch("menuPage", { heroTagline: v })} />
          <Field label="Closing line" value={form.menuPage.thankyou} area onChange={(v) => patch("menuPage", { thankyou: v })} />
          <Field label="Footer note" value={form.menuPage.footerNote} onChange={(v) => patch("menuPage", { footerNote: v })} />
        </Card>

        <Card title="Gallery page (text)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hero eyebrow" value={form.galleryPage.heroLabel} onChange={(v) => patch("galleryPage", { heroLabel: v })} />
            <Field label="Hero title" value={form.galleryPage.heroTitle} onChange={(v) => patch("galleryPage", { heroTitle: v })} />
          </div>
          <Field label="Hero tagline" value={form.galleryPage.heroTagline} onChange={(v) => patch("galleryPage", { heroTagline: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Section eyebrow" value={form.galleryPage.sectionLabel} onChange={(v) => patch("galleryPage", { sectionLabel: v })} />
            <Field label="Section heading" value={form.galleryPage.sectionHeading} onChange={(v) => patch("galleryPage", { sectionHeading: v })} />
          </div>
        </Card>

        <Card title="Explore section (home page)" hint="The destinations strip shown on the home page before the footer.">
          <Field label="Eyebrow" value={form.exploreSection.eyebrow} onChange={(v) => patch("exploreSection", { eyebrow: v })} />
          <Field label="Heading" value={form.exploreSection.heading} onChange={(v) => patch("exploreSection", { heading: v })} />
          <Field label="Description" value={form.exploreSection.description} area onChange={(v) => patch("exploreSection", { description: v })} />
        </Card>

        <Card title="Explore page (hero)" hint="The /explore page hero. Title supports two lines — use a newline (Shift+Enter) to split; the second line renders in gold.">
          <div>
            <span className={labelCls}>Hero image</span>
            {form.explorePage.heroImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.explorePage.heroImageUrl}
                alt=""
                className="h-28 w-full object-cover rounded mb-2"
              />
            )}
            <FileButton
              accept="image/*"
              label="Choose image"
              onChange={async (f) => {
                const url = await uploadTo(f);
                if (url) patch("explorePage", { heroImageUrl: url });
              }}
            />
            <Field
              label="…or paste an image URL"
              value={form.explorePage.heroImageUrl}
              onChange={(v) => patch("explorePage", { heroImageUrl: v })}
              placeholder="https://…"
            />
          </div>
          <Field label="Hero title (newline = gold second line)" value={form.explorePage.heroTitle} area onChange={(v) => patch("explorePage", { heroTitle: v })} />
          <Field label="Hero description" value={form.explorePage.heroDescription} area onChange={(v) => patch("explorePage", { heroDescription: v })} />
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 border-t border-border/60 bg-bg-secondary/95 backdrop-blur px-6 py-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gold px-6 py-3 text-xs uppercase tracking-[0.3em] text-gold-foreground disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save all changes
        </button>
      </div>
    </div>
  );
}
