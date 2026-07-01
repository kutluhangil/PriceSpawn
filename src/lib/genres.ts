export interface GenreDef {
  slug: string;
  label: string; // exact genre string as stored in catalog.genres
  blurb: string; // SEO intro (Turkish)
}

export const GENRES: GenreDef[] = [
  { slug: "aksiyon", label: "Aksiyon", blurb: "Tempolu çatışmalar ve refleks gerektiren aksiyon oyunları. En çok indirim alan aksiyon oyunlarını tüm mağazalarda TL fiyatlarıyla karşılaştır." },
  { slug: "macera", label: "Macera", blurb: "Keşif ve hikâye odaklı macera oyunları. Güncel TL fiyatlarını ve indirimleri tek bakışta gör." },
  { slug: "rpg", label: "RPG", blurb: "Karakter geliştirme, görevler ve derin dünyalar sunan rol yapma oyunları. En iyi RPG'lerin en ucuz fiyatını bul." },
  { slug: "strateji", label: "Strateji", blurb: "Plan kur, kaynak yönet, kazan. Strateji oyunlarının güncel indirimlerini karşılaştır." },
  { slug: "simulasyon", label: "Simülasyon", blurb: "Uçuştan çiftliğe gerçekçi simülasyon oyunları. En uygun TL fiyatlarını gör." },
  { slug: "fps", label: "FPS", blurb: "Birinci şahıs nişancı oyunları. FPS indirimlerini TL olarak takip et." },
  { slug: "cok-oyunculu", label: "Çok Oyunculu", blurb: "Arkadaşlarınla oyna — çok oyunculu oyunların en iyi fiyatları ve indirimleri." },
  { slug: "acik-dunya", label: "Açık Dünya", blurb: "Sınırsız keşif sunan açık dünya oyunları. Güncel TL fiyatlarını karşılaştır." },
  { slug: "co-op", label: "Co-op", blurb: "Birlikte oyna — co-op destekli oyunların güncel indirimleri." },
  { slug: "roguelike", label: "Roguelike", blurb: "Her denemede yeni — roguelike oyunların en ucuz fiyatlarını bul." },
  { slug: "bulmaca", label: "Bulmaca", blurb: "Zekânı sına — bulmaca oyunlarının güncel TL fiyatları." },
  { slug: "korku", label: "Korku", blurb: "Gerilim ve korku oyunları. En iyi korku oyunlarını ucuza yakala." },
  { slug: "hayatta-kalma", label: "Hayatta Kalma", blurb: "Topla, üret, dayan — hayatta kalma oyunlarının güncel indirimleri." },
  { slug: "bilim-kurgu", label: "Bilim Kurgu", blurb: "Bilim kurgu evrenleri. En iyi sci-fi oyunlarının TL fiyatlarını gör." },
  { slug: "yaris", label: "Yarış", blurb: "Hız tutkunları için yarış oyunları. Güncel TL fiyatlarını karşılaştır." },
  { slug: "jrpg", label: "JRPG", blurb: "Japon rol yapma oyunları. En iyi JRPG indirimlerini bul." },
  { slug: "indie", label: "Indie", blurb: "Bağımsız yapımcı oyunları — yaratıcı ve uygun fiyatlı. Güncel indirimleri gör." },
  { slug: "platform", label: "Platform", blurb: "Zıpla, koş, geç — platform oyunlarının en ucuz fiyatları." },
];

const BY_SLUG = new Map(GENRES.map((g) => [g.slug, g]));
export function genreBySlug(slug: string): GenreDef | undefined {
  return BY_SLUG.get(slug);
}

const SLUG_BY_LABEL = new Map(GENRES.map((g) => [g.label, g.slug]));
/** Slug for a stored genre label, or undefined if not a curated landing genre. */
export function slugForGenre(label: string): string | undefined {
  return SLUG_BY_LABEL.get(label);
}

export interface GenreHubItem {
  label: string;
  count: number;
  slug?: string;
  blurb?: string;
  href: string;
}

/**
 * Merge real catalog genre counts with the curated landing defs into a hub list:
 * drop tiny genres, sort by popularity, attach blurb/slug where curated, and
 * point each tile at the full-catalog genre filter.
 */
export function genreHub(rows: { genre: string; count: number }[], minCount = 1): GenreHubItem[] {
  return rows
    .filter((r) => r.count >= minCount)
    .sort((a, b) => b.count - a.count)
    .map((r) => {
      const def = GENRES.find((g) => g.label === r.genre);
      return {
        label: r.genre,
        count: r.count,
        slug: def?.slug,
        blurb: def?.blurb,
        href: `/oyunlar?g=${encodeURIComponent(r.genre)}`,
      };
    });
}
