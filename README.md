# Quantaflow Website

Marketing website for **Quantaflow**, a consultancy for AI systems, business automation and data analytics.

Plain HTML, CSS and JavaScript. No build step, no framework, no server needed.

## Pages

| Route | Page |
|---|---|
| `#/` | Home: particle name hero, services, recent builds, process, about |
| `#/services` | AI systems, automation and data analytics in detail |
| `#/work` | Case studies |
| `#/analytics` | Interactive analytics lab (paste or upload a CSV, get charts and insights) |
| `#/contact` | Contact form, WhatsApp, email and social links |

## Features

- Particle hero: grains form the brand name, react to the cursor, scatter on click
- Wave reveal: headings and paragraphs are printed by a band of ASCII shading as they scroll into view
- Hover effects: sweep on links, retype on buttons, wave on project titles, ASCII shade on the footer name
- Analytics lab: runs fully in the browser, detects number/date/text columns, builds trend, ranking, distribution, share and correlation views, and writes plain-English insights
- WhatsApp button in the nav (icon in the top bar on phones)
- Dark and light themes, mobile layout, keyboard support, respects "reduce motion"

## Project structure

```
quantaflow-website/
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
  brand: "Quantaflow",
  brandLine: "QUANTAFLOW",              // what the particles spell
  brandLinesMobile: ["QUANTA", "FLOW"], // two lines on phones
  email: "hello@yourdomain.com",
  whatsapp: "923001234567",             // country code + number, digits only
  whatsappMessage: "Hi, I'd like to talk about automating part of my business.",
  linkedin: "https://www.linkedin.com/",
  youtube: "https://www.youtube.com/"
};
```

If you rename the brand, also change the logo text (`quanta/flow`), the footer name and the `<title>` in `index.html`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy

**GitHub Pages:** push to GitHub, then Settings > Pages > Source: `main` branch, `/ (root)`. The site goes live at `https://<username>.github.io/quantaflow-website/`.

**Netlify or Vercel:** import the repository. No build command; publish directory is the repository root.

## Notes

- The contact form opens the visitor's email app with the message filled in. To receive submissions directly, point the form at a service such as Formspree or an n8n webhook.
- Charts load Chart.js from jsDelivr. If it can't load, the analytics lab still shows numbers and insights.
- The analytics lab accepts CSV. Excel files need to be saved as CSV first.
