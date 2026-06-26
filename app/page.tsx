import PromoBar from "@/components/PromoBar";
import Nav from "@/components/Nav";
import Grain from "@/components/Grain";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import Journey from "@/components/Journey";
import ChefSpecials from "@/components/ChefSpecials";
import Reviews from "@/components/Reviews";
import ExploreSection from "@/components/ExploreSection";
import Visit from "@/components/Visit";
import SiteFooter from "@/components/SiteFooter";
import AiConcierge from "@/components/AiConcierge";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import { getSiteContent, getChefSpecials } from "@/lib/content";
import { getFeaturedDestinations } from "@/lib/explore";

// Content is editable from the admin — render on each request so edits show up.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [c, specials, featured] = await Promise.all([
    getSiteContent(),
    getChefSpecials(),
    getFeaturedDestinations(),
  ]);

  return (
    <>
      <PromoBar message={c.promo.message} />
      <Nav content={c.nav} />
      <Grain />

      <div
        id="vc-stack"
        style={{ position: "relative", width: "100%", background: "#071821" }}
      >
        <Hero content={c.hero} />
        <Story content={c.story} />
        <Journey content={c.journey} />
        <ChefSpecials content={c.chefSpecials} dishes={specials} />
        <Reviews content={c.reviews} />
        <ExploreSection destinations={featured} content={c.exploreSection} />
        <Visit content={c.visit} />
        <SiteFooter content={c.footer} />
      </div>

      <AiConcierge />
      <WhatsAppFAB phone={c.visit.phone} />
    </>
  );
}
