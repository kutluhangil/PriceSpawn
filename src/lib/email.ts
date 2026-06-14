/**
 * Transactional email via Resend's HTTP API (no SDK dependency).
 * Requires env: RESEND_API_KEY and EMAIL_FROM (e.g. "pricespawn <fiyat@pricespawn.com>").
 */
import { SITE_SHORT } from "@/lib/site";

const ENDPOINT = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const shell = (inner: string, footer = "") => `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:28px 24px;color:#14161e">
  <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:18px">
    price<span style="color:#6356f0">spawn</span>
  </div>
  ${inner}
  <hr style="border:none;border-top:1px solid #e6e7ee;margin:24px 0" />
  <p style="font-size:12px;color:#8b91a7;line-height:1.6">${footer || `${SITE_SHORT} — Türkiye'deki oyun fiyatlarını karşılaştıran bağımsız rehber.`}</p>
</div>`;

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#6356f0;color:#fff;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:999px;font-size:14px">${label}</a>`;

export function verifyEmailHtml(verifyUrl: string): string {
  return shell(`
    <h1 style="font-size:18px;margin:0 0 10px">E-posta bildirimlerini onayla</h1>
    <p style="font-size:14px;line-height:1.6;color:#2a2d3a;margin:0 0 20px">
      Takip ettiğin oyunlar hedef fiyatına düştüğünde sana e-posta gönderebilmemiz için bu adresi onayla.
    </p>
    ${btn(verifyUrl, "E-postamı onayla")}
    <p style="font-size:12px;color:#8b91a7;margin-top:16px">Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.</p>
  `);
}

export function priceDropHtml(opts: {
  title: string;
  priceText: string;
  storeText?: string;
  gameUrl: string;
  unsubUrl: string;
}): string {
  return shell(
    `
    <h1 style="font-size:18px;margin:0 0 6px">🎯 Fiyat düştü!</h1>
    <p style="font-size:15px;line-height:1.5;color:#2a2d3a;margin:0 0 4px">
      <strong>${opts.title}</strong> hedef fiyatına ulaştı.
    </p>
    <p style="font-size:26px;font-weight:800;color:#15803d;margin:6px 0 18px">${opts.priceText}${
      opts.storeText ? ` <span style="font-size:13px;font-weight:500;color:#8b91a7">· ${opts.storeText}</span>` : ""
    }</p>
    ${btn(opts.gameUrl, "Fiyatları gör")}
  `,
    `Bu bildirimi almak istemiyorsan <a href="${opts.unsubUrl}" style="color:#6356f0">aboneliği iptal et</a>.`,
  );
}
