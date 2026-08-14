import Sidebar from "./Sidebar";
import HeroVisual from "./HeroVisual";
import ContentPanel from "./ContentPanel";

export default function HeroSection() {
  return (
    <main className="relative grid h-[100svh] w-full grid-cols-[60px_1fr] overflow-hidden border border-border lg:grid-cols-[60px_1fr_400px]">
      <Sidebar />
      <HeroVisual />
      <ContentPanel />
    </main>
  );
}
