// Demo kuru — ileride canlı kur API'sine bağlanacak (tek değişiklik noktası).
export const USD_TRY = 44.2;

export function toTRY(usd: number): number {
  return Math.round(usd * USD_TRY * 100) / 100;
}
