export function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(31, h) + s.charCodeAt(i) | 0; // | 0 coalesces the number to 32 bits
  return h >>> 0; // make sure we have an unsigned number
}
