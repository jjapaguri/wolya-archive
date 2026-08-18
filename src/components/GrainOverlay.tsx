"use client";

import { useEffect, useRef } from "react";

type GrainOverlayProps = {
  /** 노이즈 픽셀의 알파값 (0~255). 데스크톱 20, 모바일 디자인 15. */
  alpha?: number;
  /**
   * 프레임 간 최소 간격(ms). 0이면 매 프레임 다시 그린다.
   * 모바일은 배터리·발열 때문에 50ms로 낮춰 쓴다.
   */
  frameIntervalMs?: number;
  /** 캔버스 불투명도. 디자인 기준 0.05. */
  opacity?: number;
};

export default function GrainOverlay({
  alpha = 20,
  frameIntervalMs = 0,
  opacity = 0.05,
}: GrainOverlayProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function grain() {
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = alpha;
      }

      ctx.putImageData(imageData, 0, 0);
    }

    function loop() {
      grain();
      if (frameIntervalMs > 0) {
        timeoutId = setTimeout(() => {
          frameId = requestAnimationFrame(loop);
        }, frameIntervalMs);
      } else {
        frameId = requestAnimationFrame(loop);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [alpha, frameIntervalMs]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999] h-full w-full"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
