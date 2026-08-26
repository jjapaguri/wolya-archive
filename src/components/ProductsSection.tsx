"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { fillRow, OUTFIT_ROW_MIN_ITEMS, type Product } from "@/data/products";

/**
 * 홈 코디 교차 슬라이드 (데스크톱 `/`).
 *
 * 윗줄=상의, 아랫줄=하의가 서로 반대 방향으로 흐르면서 가운데에서 만나는 조합이
 * 계속 바뀌어 보이는 구간. 그래서 두 줄 간격을 4px 까지 붙이고, 글자는 이미지
 * 바깥쪽(상의는 위, 하의는 아래)으로 밀어 옷끼리 맞닿게 한다.
 *
 * 상품은 서버 컴포넌트(`src/app/page.tsx`)가 DB 에서 읽어 props 로 내려준다.
 * 이 컴포넌트는 "use client" 라 조회 계층(`@/lib/products`)을 직접 import 할 수 없다 —
 * 그렇게 하면 `pg` 가 브라우저 번들로 끌려 들어가 빌드가 깨진다.
 *
 * 카드에는 품명과 짧은 실측 한 줄만 둔다 — 원단·핏·추천 대상은 상세 페이지 몫.
 * 상의·하의 어느 한쪽이 `OUTFIT_ROW_MIN_ITEMS` 에 못 미치면 구간을 렌더하지 않는다.
 * 목록·상세용 큰 카드(`ProductCard.tsx`)는 `/shop` 이 쓰므로 여기서 재사용하지 않는다.
 */

/** 카드 150px + 카드 간격 8px = 158px. 묶음 하나가 4K 폭(3840px)도 덮도록 채운다 */
const MIN_PER_ROW = 26;

/** 흐르는 중 오탭 방지 — 이 이상 움직이거나(px) 이 시간을 넘기면(ms) 이동하지 않는다 */
const MOVE_TOLERANCE = 12;
const PRESS_TIMEOUT = 600;

function OutfitCard({ product, clone }: { product: Product; clone: boolean }) {
  const href = `/product/${product.slug}`;
  const isTop = product.kind === "top";

  const info = (
    <div className={isTop ? "pb-1" : "pt-1"}>
      <div className="truncate font-kr text-[10px] leading-[1.4] text-fg/45">{product.name}</div>
      <div className="truncate font-sans text-[9px] leading-[1.4] tabular-nums text-fg/30">
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
      className="block w-[150px] shrink-0"
    >
      {isTop && info}
      <div
        className={`relative w-full bg-accent-dim ${isTop ? "aspect-square" : "aspect-[1/1.18]"}`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="150px"
          className="object-cover [filter:grayscale(30%)_contrast(1.1)_brightness(0.85)]"
        />
      </div>
      {!isTop && info}
    </Link>
  );
}

export default function ProductsSection({
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

    // 포인터 클릭은 흐르는 도중 눌린 카드가 아니라 손을 뗀 위치의 카드로 가버린다.
    // 기본 동작을 막고, pointerdown 시점에 기억해 둔 카드로 직접 보낸다.
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
    <section className="relative z-10 overflow-hidden border-t border-border bg-bg py-20 lg:py-[120px]">
      <div
        className="outfit-marquee overflow-hidden"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <div className="outfit-row-top flex w-max gap-2">
          {[...topRow, ...topRow].map((product, i) => (
            <OutfitCard
              key={`top-${product.id}-${i}`}
              product={product}
              clone={i >= tops.length}
            />
          ))}
        </div>

        <div className="outfit-row-bottom mt-1 flex w-max gap-2">
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
