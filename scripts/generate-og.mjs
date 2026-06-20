// Regenerate the 1200x630 social share image: `npm run og`
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#0d1a24"/>
    </linearGradient>
    <linearGradient id="teal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2dccbd"/>
      <stop offset="1" stop-color="#0d9488"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.12" r="0.6">
      <stop offset="0" stop-color="#14b8a6" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#14b8a6" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Logo tile -->
  <rect x="80" y="74" width="76" height="76" rx="18" fill="url(#teal)"/>
  <g fill="#ffffff">
    <ellipse cx="118" cy="130" rx="22" ry="8.5"/>
    <ellipse cx="118" cy="114" rx="16.5" ry="7" opacity="0.92"/>
    <ellipse cx="118" cy="101" rx="11" ry="5.5" opacity="0.85"/>
    <circle cx="118" cy="89" r="6.2"/>
  </g>
  <text x="174" y="126" font-family="Sora, Segoe UI, sans-serif" font-size="42" font-weight="700" fill="#ffffff">Cairn</text>

  <!-- Eyebrow -->
  <text x="82" y="244" font-family="Segoe UI, Inter, sans-serif" font-size="22" font-weight="600" letter-spacing="3" fill="#5be4d2">THE SYSTEM OF RECORD FOR AI PROJECTS</text>

  <!-- Headline -->
  <text x="80" y="330" font-family="Sora, Segoe UI, sans-serif" font-size="74" font-weight="700" fill="#ffffff">One source of truth</text>
  <text x="80" y="418" font-family="Sora, Segoe UI, sans-serif" font-size="74" font-weight="700" fill="#ffffff">for <tspan fill="#2dccbd">every AI project</tspan>.</text>

  <!-- Subhead -->
  <text x="82" y="488" font-family="Segoe UI, Inter, sans-serif" font-size="27" font-weight="400" fill="#94a3b8">Portfolio → project → story → task, with provider-agnostic</text>
  <text x="82" y="524" font-family="Segoe UI, Inter, sans-serif" font-size="27" font-weight="400" fill="#94a3b8">AI attribution across Copilot, ChatGPT, Gemini &amp; Claude.</text>

  <!-- Provider chips -->
  <g font-family="Segoe UI, Inter, sans-serif" font-size="20" font-weight="600">
    <rect x="80" y="560" width="118" height="40" rx="10" fill="#ffffff" opacity="0.07"/>
    <text x="139" y="586" fill="#cbd5e1" text-anchor="middle">Copilot</text>
    <rect x="210" y="560" width="128" height="40" rx="10" fill="#ffffff" opacity="0.07"/>
    <text x="274" y="586" fill="#cbd5e1" text-anchor="middle">ChatGPT</text>
    <rect x="350" y="560" width="118" height="40" rx="10" fill="#ffffff" opacity="0.07"/>
    <text x="409" y="586" fill="#cbd5e1" text-anchor="middle">Gemini</text>
    <rect x="480" y="560" width="110" height="40" rx="10" fill="#ffffff" opacity="0.07"/>
    <text x="535" y="586" fill="#cbd5e1" text-anchor="middle">Claude</text>
  </g>

  <!-- Decorative cairn stack on the right -->
  <g fill="url(#teal)" opacity="0.95">
    <ellipse cx="1010" cy="470" rx="120" ry="34"/>
    <ellipse cx="1010" cy="388" rx="96" ry="30" opacity="0.9"/>
    <ellipse cx="1010" cy="316" rx="72" ry="26" opacity="0.82"/>
    <ellipse cx="1010" cy="256" rx="50" ry="22" opacity="0.74"/>
    <circle cx="1010" cy="206" r="26"/>
  </g>
</svg>`

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  // Inter/Sora aren't installed as system fonts; default unmatched families to a
  // clean sans (Segoe UI on Windows) instead of resvg's serif fallback.
  font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' },
})
const png = resvg.render().asPng()
const out = join(__dirname, '..', 'public', 'og-image.png')
writeFileSync(out, png)
console.log(`Wrote ${out} (${(png.length / 1024).toFixed(1)} kB)`)
