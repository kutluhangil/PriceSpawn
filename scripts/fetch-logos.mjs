// Fetch real, full-colour, transparent official logos from Wikipedia/Wikimedia.
// Picks the infobox logo file from each company's page (SVG preferred → vector,
// original colours, transparent bg). Saves to public/logos/<id>.<ext> and prints
// a manifest. Run: node scripts/fetch-logos.mjs
import { writeFile, mkdir } from "node:fs/promises";

const UA = "PriceSpawnLogoFetch/1.0 (https://pricespawn.com; contact admin)";
const API = "https://en.wikipedia.org/w/api.php";

// id → { page: Wikipedia article, file?: explicit "File:..." override }
const MAP = {
  valve: { page: "Valve Corporation", file: "File:Valve logo.svg" },
  sony: { page: "PlayStation", file: "File:PlayStation logo.svg" },
  xbox: { page: "Xbox Game Studios" },
  nintendo: { page: "Nintendo", file: "File:Nintendo.svg" },
  epic: { page: "Epic Games", file: "File:Epic Games logo.svg" },
  rockstar: { page: "Rockstar Games", file: "File:Rockstar Games Logo.svg" },
  cdpr: { page: "CD Projekt", file: "File:CD Projekt Red logo.svg" },
  ea: { page: "Electronic Arts", file: "File:Electronic Arts 2020.svg" },
  ubisoft: { page: "Ubisoft", file: "File:Ubisoft logo.svg" },
  taketwo: { page: "Take-Two Interactive" },
  activision: { page: "Activision", file: "File:Activision.svg" },
  blizzard: { page: "Blizzard Entertainment", file: "File:Blizzard Entertainment Logo 2015.svg" },
  squareenix: { page: "Square Enix", file: "File:Square Enix logo.svg" },
  capcom: { page: "Capcom", file: "File:Capcom logo.svg" },
  bandainamco: { page: "Bandai Namco Entertainment", file: "File:Bandai Namco logo (2022).svg" },
  sega: { page: "Sega", file: "File:SEGA logo.svg" },
  konami: { page: "Konami", file: "File:Konami logo.svg" },
  fromsoftware: { page: "FromSoftware", file: "File:Fromsoftware logo.svg" },
  riot: { page: "Riot Games", file: "File:Riot Games 2022.svg" },
  larian: { page: "Larian Studios", file: "File:Larian Studios Logo 2012.png" },
  bethesda: { page: "Bethesda Game Studios", file: "File:Bethesda Game Studios logo.svg" },
  kojima: { page: "Kojima Productions", file: "File:Kojima Productions logo.svg" },
  naughtydog: { page: "Naughty Dog", file: "File:Naughty Dog logo.svg" },
  insomniac: { page: "Insomniac Games", file: "File:Insomniac Games logo.svg" },
  remedy: { page: "Remedy Entertainment", file: "File:Remedy Entertainment logo.svg" },
  id: { page: "Id Software", file: "File:Id Software logo.svg" },
  bungie: { page: "Bungie", file: "File:Bungie 2020.svg" },
  respawn: { page: "Respawn Entertainment", file: "File:Respawn Entertainment logo.svg" },
  obsidian: { page: "Obsidian Entertainment", file: "File:Obsidian Entertainment logo.svg" },
  paradox: { page: "Paradox Interactive", file: "File:Paradox Interactive logo.svg" },
  mojang: { page: "Mojang Studios", file: "File:Mojang Studios logo.svg" },
  devolver: { page: "Devolver Digital", file: "File:Devolver Digital logo.svg" },
  annapurna: { page: "Annapurna Interactive", file: "File:Annapurna Interactive logo.svg" },
  supergiant: { page: "Supergiant Games", file: "File:Supergiant Games New Logo.png" },
  teamcherry: { page: "Team Cherry" },
  concernedape: { page: "Eric Barone" },
  relogic: { page: "Re-Logic" },
  elevenbit: { page: "11 bit studios", file: "File:11 bit studios logo.svg" },
  hellogames: { page: "Hello Games", file: "File:Hello Games Logo.png" },
  gsc: { page: "GSC Game World", file: "File:GSC Game World logo.svg" },
};

const BLOCK = ["commons-logo", "wikimedia", "wikidata", "free and open-source", "foss", "ooui", "edit-", "padlock", "question_book", "speakerlink", "red_pencil", "symbol_", "flag_of", "wiki.png", "wikipedia"];

async function api(params) {
  const u = new URL(API);
  u.search = new URLSearchParams({ format: "json", ...params }).toString();
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  return r.json();
}

async function pageImages(title) {
  const d = await api({ action: "query", prop: "images", imlimit: "500", titles: title });
  const p = Object.values(d.query.pages)[0];
  return (p.images || []).map((i) => i.title);
}

function pickLogo(files, page) {
  const tokens = page.toLowerCase().replace(/[().,]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const cands = files.filter((f) => {
    const l = f.toLowerCase();
    return /\.(svg|png)$/.test(l) && l.includes("logo") && !BLOCK.some((b) => l.includes(b));
  });
  const scored = cands.map((f) => {
    const l = f.toLowerCase();
    let s = 0;
    if (tokens[0] && l.includes(tokens[0])) s += 3;
    for (const t of tokens.slice(1)) if (l.includes(t)) s += 1;
    if (l.endsWith(".svg")) s += 1;
    return { f, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.length ? scored[0].f : null;
}

async function fileUrl(fileTitle) {
  const d = await api({ action: "query", prop: "imageinfo", iiprop: "url", titles: fileTitle });
  const p = Object.values(d.query.pages)[0];
  return p?.imageinfo?.[0]?.url || null;
}

await mkdir("public/logos", { recursive: true });
const manifest = {};
for (const [id, { page, file }] of Object.entries(MAP)) {
  try {
    let f = file;
    if (!f) {
      const imgs = await pageImages(page);
      f = pickLogo(imgs, page);
    }
    if (!f) { console.log(`MISS  ${id} (${page}) — no logo file`); continue; }
    let url = await fileUrl(f);
    if (!url) { console.log(`MISS  ${id} — ${f} no url (wrong name?)`); continue; }
    const ext = url.toLowerCase().endsWith(".png") ? "png" : url.toLowerCase().endsWith(".svg") ? "svg" : url.split(".").pop().split("?")[0].toLowerCase();
    const bin = Buffer.from(await (await fetch(url, { headers: { "User-Agent": UA } })).arrayBuffer());
    await writeFile(`public/logos/${id}.${ext}`, bin);
    manifest[id] = `${id}.${ext}`;
    console.log(`OK    ${id} -> ${f}  (${ext}, ${bin.length}b)`);
  } catch (e) {
    console.log(`ERR   ${id}: ${String(e).slice(0, 80)}`);
  }
  await new Promise((r) => setTimeout(r, 250));
}
console.log("\nMANIFEST", JSON.stringify(manifest, null, 0));
