/* The "a" of the logo, as geometry the meters draw with: the bowl and
   tail silhouette pulled directly from the AimLogo paths, the counter
   (the logo's white dot) and a square viewBox around them. Shared by
   the dashboard's meter and the week of small "a"s. */

export const A_BOWL_CX = 241.5;
export const A_BOWL_CY = 293.5;
// The logo's bowl is an ellipse, a unit wider than it is tall: 64.5
// across, 63.5 up, its lowest point at 357.
export const A_BOWL_RX = 64.5;
export const A_BOWL_RY = 63.5;
// The logo's tail, with one change for the meters, which draw the
// letter as an outline: its base drops a unit to the bowl's lowest point
// (356 -> 357) and starts there (x 233 -> 241.5). In the logo the bowl
// overshoots the tail's base by a unit, as a round letter does its
// baseline; filled, that can't be seen, but an outline showed it as a
// notch under the tail. Now the bowl's flat bottom runs straight into
// the tail's base. The tail's left edge is inside the bowl, so nothing
// else moves.
export const A_TAIL_PATH =
  "M305.782 288.417L306 290V357H241.5V279H302.256L305.782 288.417Z";
export const A_COUNTER_CX = 242;
export const A_COUNTER_CY = 294.5;
export const A_COUNTER_RX = 20;
export const A_COUNTER_RY = 20.5;

export const A_VB_X = 170;
export const A_VB_Y = 222;
export const A_VB_SIZE = 142;
export const A_TOP = A_BOWL_CY - A_BOWL_RY;
export const A_HEIGHT = 2 * A_BOWL_RY;
export const A_BOTTOM = A_TOP + A_HEIGHT;
// The tail's box, from A_TAIL_PATH (its chamfered corner is too small to
// count).
const A_TAIL = { left: 241.5, right: 306, top: 279, bottom: 357 };

/* The ink is sized by area, not height. The bowl is narrow at its top and
   bottom, so a level set by height made the same 25m look about a third
   bigger as the day's first session than as its last, and a 58% day
   showed 62% ink (critique, 2026-10-27). INK_AREA holds the share of the
   letter's inked area (bowl and tail, less the counter) below each half-
   unit row, counted from the bottom; inkLevel turns a share of the goal
   into the height that inks exactly that much of the letter. */
const INK_ROW = 0.5;
const INK_AREA: number[] = (() => {
  const below: number[] = [];
  let area = 0;
  for (let y = A_BOTTOM; y > A_TOP; y -= INK_ROW) {
    const mid = y - INK_ROW / 2;
    const half = A_BOWL_RX * Math.sqrt(Math.max(1 - ((mid - A_BOWL_CY) / A_BOWL_RY) ** 2, 0));
    let left = A_BOWL_CX - half;
    let right = A_BOWL_CX + half;
    if (mid >= A_TAIL.top && mid <= A_TAIL.bottom) {
      left = Math.min(left, A_TAIL.left);
      right = Math.max(right, A_TAIL.right);
    }
    let width = right - left;
    const fromCounter = mid - A_COUNTER_CY;
    if (Math.abs(fromCounter) < A_COUNTER_RY) width -= 2 * A_COUNTER_RX * Math.sqrt(1 - (fromCounter / A_COUNTER_RY) ** 2);
    area += width * INK_ROW;
    below.push(area);
  }
  return below.map((a) => a / area);
})();

export function inkLevel(share: number): number {
  if (share <= 0) return A_BOTTOM;
  if (share >= 1) return A_TOP;
  const row = INK_AREA.findIndex((a) => a >= share);
  const prev = row > 0 ? INK_AREA[row - 1] : 0;
  const within = (share - prev) / (INK_AREA[row] - prev);
  return A_BOTTOM - (row + within) * INK_ROW;
}
