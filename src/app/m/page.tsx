import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileHero from "@/components/mobile/MobileHero";
import MobileEditorial from "@/components/mobile/MobileEditorial";
import MobileWhySection from "@/components/mobile/MobileWhySection";
import MobileProducts from "@/components/mobile/MobileProducts";
import MobileTrust from "@/components/mobile/MobileTrust";
import MobileSocialProof from "@/components/mobile/MobileSocialProof";
import MobileFaq from "@/components/mobile/MobileFaq";
import MobileFooter from "@/components/mobile/MobileFooter";

export default function MobileHome() {
  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full pt-[60px]">
        <MobileHero />
        <MobileEditorial />
        <MobileWhySection />
        <MobileProducts />
        <MobileTrust />
        <MobileSocialProof />
        <MobileFaq />
      </main>

      <MobileFooter />
    </>
  );
}
