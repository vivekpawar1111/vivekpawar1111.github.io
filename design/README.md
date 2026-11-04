# CarePlus Pharma — UI template kit

Mock visual templates for the CarePlus Pharma ERP. Two design languages, same product:

- **Direction A — Warm Expressive** (`01`–`05`), built from the real tokens in `src/index.css`
  and the live dashboard/navigation shell.
- **Direction B — Clinical Clarity** (`06`), an alternate cooler, denser, instrument-like language.

Open `index.html` to browse both. Each board is a standalone HTML file; the PNG next to it
is the rendered preview. `all-templates.html` stacks every preview in one scroll.

| File | Direction | Board | What it covers |
| --- | --- | --- | --- |
| `01-dashboard.html` | A | Dashboard | Hero, 2 × 2 portrait APK quick actions, 4-up landscape web tiles, KPI cards, invoice feed, stock alerts, sales-vs-purchases |
| `02-pages.html` | A | Pages | List page header, filters, stat strip, data table, pagination, mobile record cards, PO detail |
| `03-sections.html` | A | Sections | Summary hero, tab row, section cards, tinted subsections, right rail, mobile accordion |
| `04-popups.html` | A | Popups | All-modules glass menu, global search, delete confirm, form modal, toasts, empty state, action sheet |
| `05-components.html` | A | Components | Colour, typography, buttons, chips, inputs, badges, icons, shape, elevation, feedback |
| `06-clinical.html` | B | Clinical Clarity | Web shell with persistent sidebar, KPI row, chart and attention table; mobile dashboard; purchase list; dense PO table with a receive-stock side sheet; Direction B primitives |

## Direction A — design rules captured

- **Canvas**: pages are white; cards are `#FFFFFF` with a `1px #F1E6DC` border, 26px radius and a
  single soft shadow (`0 12px 32px -22px rgba(88,51,30,.5)`).
- **Accent**: coral `#E4553C` is the only filled primary action on a screen. Secondary actions are
  ghost pills or icon circles.
- **Warm palette**: canvas `#FDF7F2`, ink `#241D19`, muted `#7C6C63`; tints red/blue/green/violet/amber
  for KPI icons and status chips.
- **M3 lavender** (`#6750A4`, `#EADDFF`) is reserved for navigation and search.
- **Quick actions**: credit-card ratio — APK `54 / 85.6` in a 2 × 2 grid, web `85.6 / 54` in one row
  of four. Each tile uses a 150° gradient, a 15% watermark icon and a coloured glow.
- **Type**: Plus Jakarta Sans, headings 15–34px at 800 weight with tight tracking, labels 9–10px at
  800 weight, amounts in tabular numerals.
- **Radii**: 10px controls, 16–20px chips/tiles, 26px cards, 28–30px overlays and hero.

## Direction B — Clinical Clarity

A deliberate counter-proposal, not a reskin: fewer curves, no gradients, more data per screen.

- **Palette**: canvas `#F4F6F8`, surfaces `#FFFFFF`, borders `#DDE4EA`; ink `#101828`, muted `#667085`,
  navy `#14324F` for avatars and dark buttons. **Apothecary teal `#0E7C66`** is the single primary;
  blue `#175CD3`, amber `#B54708`, red `#B42318`, violet `#5925DC` carry status only.
- **Geometry**: 6px controls and inputs, 8–10px cards, 14px app frame. Shadows are removed; borders do
  the structural work. The only drop shadow is under the app frame itself.
- **Type**: Inter throughout, headings 16–26px at 700 with −0.02 to −0.04em tracking, table headers
  8–9px at 600 uppercase. **Every amount, batch and date is monospace** so digits align in columns.
- **Web shell**: persistent 208px sidebar with workspace/insights groups and count badges, 58px top bar
  with search, period control and avatar. No floating bottom nav on web.
- **Density**: KPIs are flat cards with a 2px coloured left edge; lists are real tables with compact
  rows (`~36px`), zebra-free hover and a right-aligned action cluster. There is always a data table on
  the first screen below the chart.
- **Mobile**: same tokens, status-led cards instead of a table, left border colour = status, a single
  flat teal summary band (no gradient), square 2 × 2 quick actions, 62px tab bar with a raised teal
  centre action.
- **Overlays**: right-side sheets (`360px`) over a `rgba(16,24,40,.38)` backdrop, 6px fields, teal focus
  ring `0 0 0 3px rgba(14,124,102,.1)`.
- **Status language**: pill + 4px dot — `ok` teal, `warn` amber, `bad` red, `info` blue, `neutral` grey.

## Rendering previews

The previews were captured with headless Chrome at 1× device scale:

```powershell
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
& $chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
  --virtual-time-budget=5000 --window-size=1400,4200 `
  --screenshot="preview-06-clinical.png" "file:///D:/Dev/careplus-erp/design/06-clinical.html"
```

`vendor/` holds the local Plus Jakarta Sans, Inter and Lucide bundles, so the boards render
offline and do not depend on a CDN.
