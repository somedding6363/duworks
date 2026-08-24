export const serviceFanCardTransitionDuration = 0.58;

export function getServiceFanTravel(viewportHeight: number) {
  return Math.min(viewportHeight * 0.34, 260);
}

export function getServiceFanCardTransform(index: number, count: number, width: number) {
  const middle = (count - 1) / 2;
  const offset = index - middle;
  const step = Math.min(92, Math.max(42, width * 0.075));
  const angleStep = Math.min(10, Math.max(5.5, 24 / Math.max(count - 1, 1)));

  return {
    rotation: offset * angleStep,
    x: offset * step,
    y: Math.abs(offset) * 10,
  };
}
