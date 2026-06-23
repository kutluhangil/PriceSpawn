/**
 * Elle seçili (küratörlük) yaklaşan oyunlar — Billboard ile aynı felsefe.
 *
 * NO FAKE DATA: buradaki appid'ler GERÇEK Steam uygulama kimlikleridir; oyunun
 * adı, çıkış tarihi, fiyatı ve kapağı `appdetails`'ten CANLI çekilir. Tarihi
 * henüz kesin olmayan ("2026", "Q3", TBA), zaten çıkmış ya da ertelenmiş olanlar
 * takvimde OTOMATİK gizlenir — uydurma tarih yok. Liste bir izleme listesidir:
 * tarih kesinleşince oyun kendiliğinden takvime düşer.
 *
 * Sıralama önemsiz; takvim çıkış tarihine göre yeniden sıralar.
 */
export const UPCOMING_APPIDS: number[] = [
  2806050, // Halo: Campaign Evolved
  3751950, // Assassin's Creed Black Flag Resynced
  2244210, // Echoes of Aincrad (Sword Art Online)
  3259780, // FINAL FANTASY RESONANCE
  4144680, // DEAD OR ALIVE 6 Last Round
  1605850, // ZeroSpace
  2783360, // Age of Empires Mobile: PC Edition
  2153760, // Stronghold 4
  4824610, // Resident Evil Veronica
  1030300, // Hollow Knight: Silksong (çıktıysa gizlenir)
  1368140, // Corsair Cove
  2569760, // The Mound: Omen of Cthulhu
  3282300, // Mistfall Hunter
  4570720, // DragonSword: Awakening
  3765010, // Forensics: Crime Scene Detective
];
