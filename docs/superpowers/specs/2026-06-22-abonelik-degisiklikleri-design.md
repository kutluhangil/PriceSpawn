# Abonelik Giriş/Çıkış Takibi — Tasarım

Tarih: 2026-06-22
Durum: Onaylandı (kullanıcı 2026-06-22)

## Amaç

"Bu dönem Game Pass / PS Plus / EA Play / Ubisoft+ kataloğuna eklenen ve
kaldırılan oyunlar" — gerçek, geçmişe dönük değişim listeleri. ITAD `games/subs`
endpoint'i yalnız anlık üyelik verir; geçmiş kendi diff'imizle türetilir.

**Kapsam:** sadece tespit edilen değişim (eklendi/kaldırıldı). "Yakında ayrılacak"
(duyurulmuş gelecek) KAPSAM DIŞI — güvenilir kaynak yok, SAHTE VERİ YASAK.

## Bağlam (mevcut kod)

- `src/app/api/refresh-subs/route.ts` ve `scripts/refresh-subs.mjs`: ITAD
  `games/subs`'ten üyeliği yeniden kurar. Her run `DELETE FROM game_subs WHERE
  sub_id <> 'psplus'` + yeniden INSERT → **geçmiş yok**.
- `src/app/api/refresh-psplus/route.ts`: psplus üyeliğini ayrı yönetir.
- `game_subs(slug, sub_id)` tablosu anlık durumu tutar.
- `catalog(slug, title, cover, ...)` oyun metadata kaynağı (kapak/başlık).
- `src/lib/subscriptions.ts`: `SUBSCRIPTIONS` meta (label, accent, url).
- `/abonelikler` sayfası: `subs-content.tsx` (değer kartları).

## Veri modeli

Yeni tablo (`src/lib/db.ts` `ensureSchema`'ya eklenecek):

```sql
CREATE TABLE IF NOT EXISTS sub_changes (
  slug    text NOT NULL,
  sub_id  text NOT NULL,
  change  text NOT NULL,          -- 'added' | 'removed'
  day     date NOT NULL,
  PRIMARY KEY (slug, sub_id, day, change)
);
CREATE INDEX IF NOT EXISTS sub_changes_recent_idx ON sub_changes (sub_id, day DESC);
```

- PK aynı gün aynı değişimi tekilleştirir.
- Çıkıp geri giren oyun → farklı günlerde ayrı kayıtlar (doğru).

## Diff mantığı

Saf fonksiyon — `src/lib/sub-diff.ts`:

```ts
export interface Membership { [slug: string]: Set<string> } // slug → sub_id set
export interface Change { slug: string; subId: string; change: "added" | "removed" }

// services: bu refresh'in sahibi olduğu sub_id'ler (ör. ITAD servisleri).
// coldServices: eski durumda HİÇ kaydı olmayan servisler → 'added' kaydetme.
export function diffMembership(
  oldM: Membership,
  newM: Membership,
  services: string[],
  coldServices: Set<string>,
): Change[]
```

Kurallar:
- Her oyun + her `services` üyesi sub_id için: yeni'de var eski'de yok → `added`;
  eski'de var yeni'de yok → `removed`.
- `coldServices` içindeki bir sub_id için `added` ATLA (soğuk başlangıç seli önlenir).
  `removed` zaten oluşamaz (eski boş).

## Refresh entegrasyonu

`refresh-subs` (route + script) ve `refresh-psplus` aynı deseni izler:

1. Rewrite'tan ÖNCE ilgili servislerin mevcut `game_subs` satırlarını oku → `oldM`.
2. Yeni üyeliği hesapla → `newM` (mevcut akış).
3. `coldServices` = bu refresh'in servislerinden, `oldM`'de hiç görünmeyenler.
4. `diffMembership(oldM, newM, services, coldServices)` → değişimler
   (`services` = bu job'ın sahip olduğu sub_id'ler).
5. Bugünün tarihiyle `INSERT INTO sub_changes ... ON CONFLICT DO NOTHING`.
6. Sonra `game_subs`'i eskisi gibi yeniden yaz (mevcut DELETE+INSERT).

- `refresh-subs` sahibi: ITAD servisleri (gamepass, eaplay, eaplaypro, ubisoftplus, luna).
- `refresh-psplus` sahibi: psplus.
- Her job yalnız kendi servislerini diff'ler → çakışma yok.

## Okuma katmanı

`src/lib/sub-changes.ts`:
- `recentChangeSummary(days = 30)`: servis başına `{ added: n, removed: m, sampleCovers: [...] }`.
- `changesBySub(subId, change, limit, offset)`: oyun listesi (catalog join: title, cover, slug, day).
  Katalogda olmayan slug atlanır.

## Yüzeyler

### Özet — `/abonelikler` üstüne bölüm
- Son 30 gün, servis başına "+N eklendi / −M çıktı" rozeti + ilk birkaç kapak.
- "Tümünü gör →" → `/abonelikler/degisiklikler`.
- Hiç değişim yoksa bölüm gizlenir (boş durum gösterme).

### Adanmış sayfa — `/abonelikler/degisiklikler`
- Server component, `revalidate` (ör. 3600).
- Servis filtresi (URL state, mevcut `filter-url.ts` deseni) + eklendi/çıktı sekmesi.
- Tarihe göre gruplu oyun kartları; kart → `/oyun/[slug]`.
- SEO: `metadata` (title/description), opsiyonel JSON-LD `ItemList`.

## i18n
- tr + en stringleri (`src/i18n/tr.ts`, `en.ts`): sayfa başlığı, "eklenenler",
  "kaldırılanlar", "son 30 gün", filtre etiketleri, boş durum.

## Test
- `vitest` — `src/lib/sub-diff.test.ts`:
  - boş eski + dolu yeni + cold service → `added` yok.
  - dolu eski + dolu yeni → doğru added/removed.
  - oyun çıkıp geri gelme → iki kayıt (çağrı bazında).
  - sahip olmayan servis değişimleri yok sayılır.

## Kapsam dışı (v2)
- Takip edilen oyun aboneliğe girince/çıkınca push/e-posta uyarısı.
- "Yakında ayrılacak" (duyurulmuş gelecek kaldırmalar).
