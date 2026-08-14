import GrainOverlay from "@/components/GrainOverlay";
import HeroSection from "@/components/HeroSection";
import EditorialSection from "@/components/EditorialSection";
import ProductsSection from "@/components/ProductsSection";
import TrustSection from "@/components/TrustSection";
import SocialProofSection from "@/components/SocialProofSection";
import FaqSection from "@/components/FaqSection";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <GrainOverlay />
      <HeroSection />
      <EditorialSection />
      <ProductsSection />
      <TrustSection />
      <SocialProofSection />
      <FaqSection />
      <SiteFooter />
    </>
  );
}
