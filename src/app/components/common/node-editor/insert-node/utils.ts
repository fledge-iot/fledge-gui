import { Position, Size } from "./types";

export function getInnerRadius(size: Size) {
  const width = size.width;
  const height = size.height;
  const minLength = Math.min(width, height);

  return minLength / 2;
}

export function checkElementIntersectPath(
  rect: Position & Size,
  pathElement: SVGPathElement,
  accuracy = 1
) {
  const pathLength = pathElement.getTotalLength();
  const innerRectRadius = getInnerRadius(rect);
  const step = Math.max(pathLength / 100, innerRectRadius / accuracy);
  const pathRect = pathElement.getBBox();

  if (
    rect.x + rect.width < pathRect.x ||
    rect.x > pathRect.x + pathRect.width ||
    rect.y + rect.height < pathRect.y ||
    rect.y > pathRect.y + pathRect.height
  ) {
    return false;
  }

  for (let i = 0; i < pathLength; i += step) {
    const point = pathElement.getPointAtLength(i);

    if (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    ) {
      return true;
    }
  }

  return false;
}
