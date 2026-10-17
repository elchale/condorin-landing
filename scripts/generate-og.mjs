// Builds src/app/opengraph-image.jpg (and its twitter-image copy), the 1200x630 preview WhatsApp and social networks show for links.
// Run with `npm run og` after changing the headline, photo or brand assets.
// Kept as a small JPG (under 300 KB) because WhatsApp skips large preview images.
import sharp from "sharp";
import { copyFile } from "fs/promises";
import { fileURLToPath } from "url";

const root = fileURLToPath(new URL("..", import.meta.url));
const W = 1200;
const H = 630;
const FONT = "Segoe UI, Arial, sans-serif";

const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#18181b" stop-opacity="0.96"/>
      <stop offset="0.55" stop-color="#18181b" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#18181b" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <text x="168" y="118" font-family="${FONT}" font-size="44" font-weight="900" fill="#fff">Condorin</text>
  <text font-family="${FONT}" font-size="60" font-weight="900" fill="#fff">
    <tspan x="70" y="250">Vigilamos la</tspan>
    <tspan x="70" y="324" fill="#ff4d5a">minería ilegal</tspan>
    <tspan x="70" y="398">en la Amazonía.</tspan>
  </text>
  <text x="70" y="480" font-family="${FONT}" font-size="32" fill="#fff" fill-opacity="0.85">Te avisamos al instante por WhatsApp.</text>
  <rect x="0" y="${H - 12}" width="${W}" height="12" fill="#e11d2e"/>
</svg>`;

const logo = await sharp(`${root}public/brand/logo.png`).resize(84, 84).png().toBuffer();
const mascot = await sharp(`${root}public/brand/condor-thumbsup.png`).resize({ height: 470 }).png().toBuffer();

await sharp(`${root}public/img/rio.jpg`)
  .resize(W, H, { fit: "cover", position: "left top" })
  .composite([
    { input: Buffer.from(overlay) },
    { input: logo, left: 70, top: 60 },
    { input: mascot, left: 860, top: H - 12 - 470 },
  ])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(`${root}src/app/opengraph-image.jpg`);

await copyFile(`${root}src/app/opengraph-image.jpg`, `${root}src/app/twitter-image.jpg`);

console.log("src/app/opengraph-image.jpg and twitter-image.jpg written");
