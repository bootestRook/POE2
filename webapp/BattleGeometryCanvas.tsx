import { useEffect, useMemo, useRef, useState } from "react";
import { BattleGeometrySnapshot, renderBattleGeometry } from "./battleGeometryRenderer";

type BattleGeometryCanvasProps = {
  snapshot: BattleGeometrySnapshot;
};

export function BattleGeometryCanvas({ snapshot }: BattleGeometryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? snapshot.width : window.innerWidth,
    height: typeof window === "undefined" ? snapshot.height : window.innerHeight
  }));

  useEffect(() => {
    function resize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const viewportSnapshot = useMemo<BattleGeometrySnapshot>(() => ({
    ...snapshot,
    width: viewport.width,
    height: viewport.height
  }), [snapshot, viewport.height, viewport.width]);
  const snapshotRef = useRef(viewportSnapshot);

  useEffect(() => {
    snapshotRef.current = viewportSnapshot;
  }, [viewportSnapshot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animationFrameId = 0;

    function draw(frameTimeMs: number) {
      if (canvas) renderBattleGeometry(canvas, snapshotRef.current, frameTimeMs);
      animationFrameId = window.requestAnimationFrame(draw);
    }

    animationFrameId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="battle-geometry-canvas"
      aria-hidden="true"
      data-visual-system="abstract-geometric"
      data-renderer="canvas"
      data-canvas-objects="entities-projectiles"
      data-geometry-enemies={viewportSnapshot.enemies.length}
      data-geometry-projectiles={viewportSnapshot.projectiles.length}
    />
  );
}
