# Coffee Selection — Site Vision & Roadmap

## 1. Site Vision

**Coffee Selection** is a premium, AI-powered coffee subscription platform built around the philosophy of "Quiet Luxury." It connects discerning coffee drinkers with the perfect specialty coffee roasters through a beautifully curated quiz experience. The site operates on two levels:

- **Consumer App** — A serene, editorial-quality front-end that guides customers through a personalized tasting quiz, delivers their ideal coffee match, and manages their subscription.
- **Roaster Portal** — A data-rich back-office for partner roasters: order management, customer insights, production queues, revenue analytics, and shipping logistics.

The visual language is Swiss-minimalist meets artisanal warmth: Noto Serif headlines, Manrope body text, cream backgrounds (#fdf9f4), deep espresso primary (#341706), and champagne gold accents (#795900). No borders — only whitespace and tonal shifts.

---

## 2. Stitch Project ID

```
projectId: [TO BE FILLED AFTER FIRST STITCH GENERATION]
```

---

## 3. Tech Stack

- **HTML/CSS/JS** — Static HTML pages with Tailwind CSS (CDN) and Google Fonts
- **Design System** — Material Design 3 color tokens, custom Tailwind config per page
- **Backend** — Supabase (PostgreSQL database, see `/supabase/`)
- **Hosting** — Static file hosting (pages live at root level as `{slug}/index.html`)

---

## 4. Sitemap — Existing Pages

### Consumer App

| Status | Page | File | Description |
|--------|------|------|-------------|
| [x] | Home | `quiet_luxury_home/index.html` | Hero landing page with quiz CTA and brand story |
| [x] | Quiz Start | `refined_quiz_start/index.html` | Welcoming intro screen before the quiz |
| [x] | Quiz Step 1 — Name | `quiet_luxury_quiz_1/index.html` | First quiz screen: name and personal greeting |
| [x] | Quiz — Exploration Level | `quiz_exploration_level/index.html` | How adventurous is the customer? |
| [x] | Quiz — Brewing Method | `quiz_brewing_method/index.html` | Espresso, filter, French press, etc. |
| [x] | Quiz — Roast Preference | `quiz_roast_preference/index.html` | Light, medium, dark roast selection |
| [x] | Quiz — Intensity | `quiz_intensity/index.html` | Flavor intensity and body preference |
| [x] | Quiz — Frequency | `quiz_frequency/index.html` | How often does the customer drink coffee? |
| [x] | Quiz — Usage Moment | `quiz_usage_moment/index.html` | Morning ritual, afternoon boost, evening indulgence |
| [x] | Quiz — Matching | `quiz_matching/index.html` | AI processing / loading screen |
| [x] | Match Result | `quiet_luxury_match_result/index.html` | Personalized coffee match reveal |
| [x] | User Dashboard | `refined_user_dashboard/index.html` | Customer portal: subscription, history, preferences |
| [x] | Checkout — Shipping | `checkout_shipping/index.html` | Delivery address entry |
| [x] | Checkout — Payment | `checkout_payment/index.html` | Payment method selection |
| [x] | Checkout — Order Review | `checkout_order_review/index.html` | Final order summary before confirming |
| [x] | Order Confirmation | `thank_you_confirmation/index.html` | Thank you / confirmation screen |
| [x] | About Us | `about_our_story/index.html` | Brand story, mission, team |
| [x] | FAQ | `faq_h_ufig_gestellte_fragen/index.html` | Häufig gestellte Fragen |
| [x] | Contact | `contact_us/index.html` | Contact form and support info |
| [x] | Brewing Guides | `brewing_guides_overview/index.html` | Editorial guides for brewing methods |

### Roaster Portal

| Status | Page | File | Description |
|--------|------|------|-------------|
| [x] | Roaster Dashboard 1 | `roaster_portal_dashboard_1/index.html` | Main roaster overview: orders, metrics |
| [x] | Roaster Dashboard 2 | `roaster_portal_dashboard_2/index.html` | Secondary roaster dashboard view |
| [x] | Customer Insights | `refined_customer_insights/index.html` | Customer taste profiles and segments |
| [x] | Revenue Analytics | `revenue_analytics/index.html` | Revenue, MRR, subscription trends |
| [x] | Order Forecast | `order_forecast/index.html` | Demand planning and production forecast |
| [x] | Production Queue | `production_queue/index.html` | Active orders ready for roasting |
| [x] | Roaster Settings | `roaster_settings/index.html` | Profile, product catalog, pricing |
| [x] | Shipping Center | `shipping_center/index.html` | Fulfillment and dispatch management |

---

## 5. Roadmap — Pages to Build Next

| Priority | Page | Description |
|----------|------|-------------|
| High | `coffee_catalog` | Public shop page: browse all available coffees by roaster/region/flavor |
| High | `coffee_detail` | Individual coffee product page: origin story, tasting notes, Brew Card layout |
| Medium | `subscription_management` | Edit, pause, or cancel subscription; change frequency and quantity |
| Medium | `account_settings` | Profile settings, password, notification preferences |
| Medium | `roaster_public_profile` | Public-facing roaster profile: their story, available coffees |
| Low | `coffee_origin_map` | Interactive editorial page: world map showing coffee origins |
| Low | `notification_center` | In-app notification feed for delivery updates, new matches |
| Low | `gift_subscription` | Gifting flow: buy a subscription as a gift |

---

## 6. Creative Freedom — Ideas for Future Screens

- **Flavor Profile Card** — A beautiful, sharable visual card showing the customer's unique taste profile (like a Spotify Wrapped for coffee)
- **Seasonal Collections** — Editorial landing page for limited-edition seasonal roasts
- **Roaster Spotlight** — Long-form editorial feature on a partner roaster
- **Brew Timer** — In-app interactive brew guide with step-by-step timer
- **Coffee Diary** — Customer journal to rate and log each coffee they receive
- **Comparison Screen** — Side-by-side comparison of two coffee profiles
