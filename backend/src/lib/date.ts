export function ymd(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
