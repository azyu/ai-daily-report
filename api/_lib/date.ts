export function todayKstYmd() {
  const now = new Date();
  const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return kst.toISOString().slice(0, 10);
}
