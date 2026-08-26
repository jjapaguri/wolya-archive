"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { fillRow, OUTFIT_ROW_MIN_ITEMS, type Product } from "@/data/products";

/**
 * 홈 코디 교차 슬라이드 (모바일 `/m`).
 *
 * 데스크톱(`ProductsSection.tsx`)과 같은 의도 — 윗줄=상의, 아랫줄=하의가 반대
 * 방향으로 흐르며 가운데에서 만나는 조합이 계속 바뀐다. 값만 모바일용이다.
 * 모바일은 멈추지 않는다: 탭은 정지가 아니라 그 아이템 상세로 가는 동작이다.
 * 데스크톱과 같이 상의·하의가 `OUTFIT_ROW_MIN_ITEMS` 에 못 미치면 렌더하지 않는다.
 *
 * 상품은 서버 컴포넌트(`src/app/m/page.tsx`)가 DB 에서 읽어 props 로 내려준다.
 * "use client" 라 조회 계층(`@/lib/products`)을 직접 import 할 수 없다 —
 * 그렇게 하면 `pg` 가 브라우저 번들로 끌려 들어가 빌드가 깨진다.
 *
 * 모바일 컴포넌트는 데스크톱 것을 import 하지 않는다 (`docs/MAP.md`).
 */

/** 카드 112px + 카드 간격 6px = 118px. 묶음 하나가 어떤 폰 폭보다도 넓도록 채운다 */
const MIN_PER_ROW = 16;

/** 흐르는 중 오탭 방지 — 이 이상 움직이거나(px) 이 시간을 넘기면(ms) 이동하지 않는다 */
const MOVE_TOLERANCE = 12;
const PRESS_TIMEOUT = 600;

function OutfitCard({ product, clone }: { product: Product; clone: boolean }) {
  const href = `/m/product/${product.slug}`;
  const isTop = product.kind === "top";

  const info = (
    <div className={isTop ? "pb-0.5" : "pt-0.5"}>
      <div className="truncate font-kr text-[9px] leading-[1.4] text-fg/45">{product.name}</div>
      <div className="truncate text-[8px] leading-[1.4] tabular-nums text-fg/30">
        {product.shortMeasure}
      </div>
    </div>
  );

  return (
    <Link
      href={href}
      data-href={href}
      aria-hidden={clone || undefined}
      tabIndex={clone ? -1 : undefined}
      className="block w-[112px] shrink-0"
    >
      {isTop && info}
      <div
        className={`relative w-full bg-accent-dim ${isTop ? "aspect-square" : "aspect-[1/1.18]"}`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="112px"
          className="object-cover [filter:grayscale(30%)_contrast(1.1)_brightness(0.85)]"
        />
      </div>
      {!isTop && info}
    </Link>
  );
}

export default function MobileProducts({
  tops,
  bottoms,
}: {
  tops: Product[];
  bottoms: Product[];
}) {
  const router = useRouter();
  const topRow = fillRow(tops, MIN_PER_ROW);
  const bottomRow = fillRow(bottoms, MIN_PER_ROW);
  const press = useRef<{ href: string; x: number; y: number; t: number } | null>(null);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const card = (event.target as HTMLElement).closest<HTMLElement>("[data-href]");
    const href = card?.dataset.href;
    press.current = href
      ? { href, x: event.clientX, y: event.clientY, t: event.timeStamp }
      : null;
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    // 키보드 Enter 는 e.detail === 0 — 링크 기본 동작에 맡긴다
    if (event.detail === 0) return;

    // 흐르는 도중 손을 뗀 위치의 카드가 아니라, 누른 순간의 카드로 보낸다.
    event.preventDefault();

    const pressed = press.current;
    press.current = null;
    if (!pressed) return;
    if (Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > MOVE_TOLERANCE) return;
    if (event.timeStamp - pressed.t > PRESS_TIMEOUT) return;

    router.push(pressed.href);
  }

  // 상의·하의 어느 한쪽이라도 최소 개수를 못 채우면 구간을 통째로 숨긴다.
  // (훅은 이 위에서 다 호출한 뒤라 조기 반환해도 호출 순서가 흔들리지 않는다)
  if (tops.length < OUTFIT_ROW_MIN_ITEMS || bottoms.length < OUTFIT_ROW_MIN_ITEMS) {
    return null;
  }

  return (
    <section className="overflow-hidden border-b border-fg/10 bg-bg py-16">
      <div className="overflow-hidden" onPointerDown={handlePointerDown} onClick={handleClick}>
        <div className="outfit-row-top-m flex w-max gap-1.5">
          {[...topRow, ...topRow].map((product, i) => (
            <OutfitCard key={`top-${product.id}-${i}`} product={product} clone={i >= tops.length} />
          ))}
        </div>

        <div className="outfit-row-bottom-m mt-[3px] flex w-max gap-1.5">
          {[...bottomRow, ...bottomRow].map((product, i) => (
            <OutfitCard
              key={`bottom-${product.id}-${i}`}
              product={product}
              clone={i >= bottoms.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
