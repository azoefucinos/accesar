/**
 * Genera todos los íconos del PWA a partir del SVG del logo.
 * Tamaños: 192, 512 (Android/PWA), 180 (Apple touch), 32 (favicon), 1200x630 (OG image).
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const SVG_PATH = path.join(process.cwd(), 'scripts', 'logo-pwa.svg')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  }

  const svg = fs.readFileSync(SVG_PATH)

  // Iconos cuadrados del PWA
  const sizes = [192, 512, 180, 32, 16]
  for (const size of sizes) {
    const out = path.join(PUBLIC_DIR, `icon-${size}.png`)
    await sharp(svg).resize(size, size).png().toFile(out)
    console.log(`✓ ${out}`)
  }

  // Apple touch icon (debe llamarse así)
  await sharp(svg).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'))
  console.log(`✓ apple-touch-icon.png`)

  // Favicon 32 con nombre estándar
  await sharp(svg).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, 'favicon-32.png'))
  console.log(`✓ favicon-32.png`)

  // OG image 1200x630 con fondo gradiente
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0d9488" />
        <stop offset="100%" stop-color="#065f46" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)" />
    <g transform="translate(80, 165)">
      <rect width="300" height="300" rx="82" fill="#10b981" />
      <circle cx="112" cy="98" r="23" fill="white" />
      <path d="M112 131v45m0 0l-26 48m26-48l30 22m-30-22l30-22" stroke="white" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M165 217l67-67" stroke="white" stroke-width="19" stroke-linecap="round" />
      <path d="M150 232h97" stroke="white" stroke-width="19" stroke-linecap="round" opacity="0.75" />
    </g>
    <text x="450" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="86" font-weight="800" fill="white">AccesAR</text>
    <text x="450" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="34" fill="rgba(255,255,255,0.85)">Plataforma colaborativa de</text>
    <text x="450" y="405" font-family="system-ui, -apple-system, sans-serif" font-size="34" fill="rgba(255,255,255,0.85)">accesibilidad urbana</text>
    <text x="450" y="490" font-family="system-ui, -apple-system, sans-serif" font-size="26" fill="rgba(255,255,255,0.65)">Mapa · Reportes · Índice · Estadísticas</text>
  </svg>`
  await sharp(Buffer.from(ogSvg)).png().toFile(path.join(PUBLIC_DIR, 'og-image.png'))
  console.log(`✓ og-image.png`)

  // Maskable icon (con padding safe-zone para Android)
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#bg)" />
    <g transform="translate(102, 102) scale(0.6)">
      <circle cx="192" cy="166" r="40" fill="white" />
      <path d="M192 224v77m0 0l-45 83m45-83l51 38m-51-38l51-38"
            stroke="white" stroke-width="29" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M282 371l115-115" stroke="white" stroke-width="33" stroke-linecap="round" />
      <path d="M256 397h166" stroke="white" stroke-width="33" stroke-linecap="round" opacity="0.75" />
    </g>
  </svg>`
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'icon-maskable-512.png'))
  console.log(`✓ icon-maskable-512.png`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
