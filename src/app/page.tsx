import GrainOverlay from "@/components/GrainOverlay";
import HeroSection from "@/components/HeroSection";
import EditorialSection from "@/components/EditorialSection";
import ProductsSection from "@/components/ProductsSection";
import TrustSection from "@/components/TrustSection";
import FaqSection from "@/components/FaqSection";
import SiteFooter from "@/components/SiteFooter";
import { listOutfitRows } from "@/lib/products";

/**
 * 상품이 DB 에서 오므로 **요청마다 렌더한다.**
 *
 * 빌드 시점에 정적으로 굳히면 두 가지가 동시에 깨진다:
 *  - 재고는 1점 1재고다. 팔린 옷이 다음 배포 때까지 계속 구매 가능으로 남는다
 *    (AGENTS.md 최상단: "품절 반영 속도와 재고 정확도가 기능 추가보다 먼저다").
 *  - 빌드 러너(CI)에는 DB 가 없다. 그때 읽힌 **빈 결과가 HTML 에 박제**된다.
 *
 * Next 16 에서 이 설정이 유효한 이유: `next.config.ts` 에 `cacheComponents` 가 없으므로
 * 이전 캐싱 모델이 적용되고 `dynamic` 세그먼트 설정이 그대로 산다
 * (`node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`).
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const { tops, bottoms } = await listOutfitRows();

  return (
    <>
      <GrainOverlay />
      <HeroSection />
      <EditorialSection />
      <ProductsSection tops={tops} bottoms={bottoms} />
      <TrustSection />
      <FaqSection />
      <SiteFooter />
    </>
  );
}
