export type TopDownDepthPoint = {
  x: number;
  y: number;
};

export function topDownDepth(worldX: number, worldY: number): number {
  return worldY;
}

export function compareTopDownDepth(left: TopDownDepthPoint, right: TopDownDepthPoint): number {
  return topDownDepth(left.x, left.y) - topDownDepth(right.x, right.y);
}
