# AnalySight Website

Marketing website for **AnalySight** (https://analysight.com), a consultancy for AI systems, business automation and data analytics.

Plain HTML, CSS and JavaScript. No build step, no framework, no server needed.

## Pages

| Route | Page |
|---|---|
| `#/` | Home: particle name hero, services, recent builds, process, about |
| `#/services` | AI systems, automation and data analytics in detail |
| `#/work` | Case studies |
| `#/analytics` | Data project showcase, interactive analytics lab, and the lead form |
| `#/analytics?lead` | Same page, scrolled straight to the lead form (use this in ads, posts and bios) |
| `#/contact` | Contact form, WhatsApp, email and social links |

## Features

- Particle hero: grains form the brand name, react to the cursor, scatter on click
- Wave reveal: headings and paragraphs are printed by a band of ASCII shading as they scroll into view
- Hover effects: sweep on links, retype on buttons, wave on project titles, ASCII shade on the footer name
- Analytics lab: runs fully in the browser, detects number/date/text columns, builds trend, ranking, distribution, share and correlation views, and writes plain-English insights
- Data project showcase: three live example dashboards (sales, marketing, inventory) that open in the lab
- Lead capture: a "free data review" form that sends leads to an n8n workflow, with WhatsApp/email fallback
- WhatsApp button in the nav (icon in the top bar on phones)
- Dark and light themes, mobile layout, keyboard support, respects "reduce motion"

## Project structure

```
analysight-website/
├── index.html            # all pages (hash-routed)
├── assets/
│   ├── css/style.css     # design tokens, layout, effects
│   ├── js/config.js      # EDIT THIS: brand name, email, WhatsApp, social links
│   ├── js/main.js        # effects, router, analytics lab, contact form
│   └── favicon.svg
├── .nojekyll             # lets GitHub Pages serve the files as-is
└── README.md
```

## Before going live

Edit `assets/js/config.js`:

```js
const CONFIG = {
  brand: "AnalySight",
  brandLine: "ANALYSIGHT",              // what the particles spell
  brandLinesMobile: ["ANALY", "SIGHT"], // two lines on phones
  email: "hello@analysight.com",
  whatsapp: "923001234567",             // country code + number, digits only
  whatsappMessage: "Hi, I'd like to talk about automating part of my business.",
  linkedin: "https://www.linkedin.com/",
  youtube: "https://www.youtube.com/"
};
```

If you rename the brand, also change the logo text (`analy/sight`), the footer name and the `<title>` in `index.html`.

## Lead capture

Both the data review form (analytics page) and the contact form send leads to:

```
https://atifmahmoodai.app.n8n.cloud/webhook/analysight-data-leads
```

That URL belongs to the n8n workflow **AnalySight: Data Analytics Website Leads**. It:

1. validates the lead (name, email, project type, message) and ignores bots that fill the hidden `website` field,
2. scores it 0 to 100 from budget, timeline, data size, whether they tried the lab, company and WhatsApp given,
3. marks it `hot` (60+), `warm` (35 to 59) or `cold`,
4. saves it to the n8n data table **website_data_analytics_leads**,
5. replies with a reference number that the visitor sees.

If the webhook can't be reached, the visitor gets ready-made WhatsApp and email links with their details filled in, so the lead is not lost.

To send leads somewhere else, change `leadWebhook` in `assets/js/config.js`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy

**Cloudflare Pages (recommended, the domain is registered at Cloudflare):** Workers & Pages > Create > Pages > Connect to Git > pick this repo. Build command: none. Output directory: `/`. Then Custom domains > add `analysight.com` and `www.analysight.com`.

**GitHub Pages:** push to GitHub, then Settings > Pages > Source: `main` branch, `/ (root)`. The site goes live at `https://<username>.github.io/analysight-website/`.

**Netlify or Vercel:** import the repository. No build command; publish directory is the repository root.

## Notes

- Charts load Chart.js from jsDelivr. If it can't load, the analytics lab still shows numbers and insights.
- The analytics lab accepts CSV. Excel files need to be saved as CSV first.
