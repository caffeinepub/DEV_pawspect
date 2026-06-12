# Design Brief — Pawspect

**Context:** Premium pet-sitting SaaS with team collaboration. Sitters are the heroes; clients feel assured and cared for. Design must convey trust, professionalism, and ease. Visual identity: billion-dollar company aesthetic — Linear, Stripe, Airbnb caliber. Teams enable co-booking with split payouts and Slack-like collaboration.

**Tone:** Approachable, trustworthy, premium. Refined but human. No corporate coldness; no cartoonish friendliness. Aspirational but grounded. Teams feel professional and collaborative — not gamified.

**Differentiation:** Photography-first sitter cards with full-width hero crops. Earning/growth mindset in analytics — aspirational language. Glassmorphism and premium shadows throughout. Cinematic hero section. Zero duplicate messaging. Clean, succinct copy. Teams: avatar stacks, split earnings clarity, invite lifecycle states, job thread management.

**Light Mode Public Sitter Page:** Truly light mode with pure white surfaces, near-black text, warm amber accents. Hero: lifestyle photo or light warm gradient overlay, NOT dark navy. Cards: white with subtle shadows (0 1px 3px / 0 4px 16px). Gallery: clean grid on white background. Credentials: soft colored pills (blue, green, amber). Availability calendar: green dots for available, light gray for booked. Typography: Bricolage Grotesque bold headlines, Plus Jakarta Sans refined body. World-class quality competitive with Wix/Squarespace/GoDaddy sites. Mobile: all tap targets 48px min, hero text always readable, safe area respected.

## New Feature: Professional Credentials Checklist

**7-item self-attested credentials for sitters:**
1. Business License/Permit — FileCheck icon
2. Insured & Bonded — Shield icon
3. Background Check — CheckShield icon
4. Client References Available — Users icon
5. Service Agreement/Contract — FileText icon
6. Professional Certification (CPPS®) — Award icon
7. Professional Organization Member (PSI) — Users2 icon

**Display Rules:**
- Checked credentials appear as amber/gold badge pills (accent token: `0.72 0.18 55`)
- Sitter cards: show top 2–3 checked credentials below service pills
- Public storefront: dedicated "Professional Credentials" section (below services, above availability calendar)
- Sitter portal: collapsible "Professional Credentials" in Profile Settings with checklist + self-attestation disclaimer modal
- Mobile-first responsive; no horizontal scroll on badge rows
- Badge styling: `12px gap`, `0.75rem` text, `Font: Plus Jakarta Sans 600`, icon size `14px`

## Color Palette (OKLCH)



| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| Background | `0.99 0.002 60` | `0.115 0.025 265` | Pure off-white (light), rich slate (dark) |
| Card | `1.0 0 0` | `0.16 0.028 265` | Pure white (light), elevated dark (dark) |
| Foreground | `0.12 0.015 260` | `0.97 0.008 75` | Near-black (light), near-white (dark) |
| Border | `0.90 0.01 60` | `0.28 0.04 265` | Soft warm border (light), cool dark (dark) |
| Input | `0.92 0.01 60` | `0.28 0.04 265` | Light form fields, dark inputs |
| Primary | `0.45 0.16 255` | `0.58 0.18 255` | Deep indigo — trust, platform actions |
| Accent | `0.72 0.18 55` | `0.72 0.18 55` | Warm amber — earnings emphasis, CTAs |
| Muted | `0.96 0.008 75` | `0.22 0.035 265` | Light secondary bg, dark secondary |
| Success | `0.65 0.12 130` | — | Green — verified, available, completed |
| Info | `0.65 0.1 240` | — | Cool blue — response time, info badges |

## Typography

| Scale | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| H1 | Bricolage Grotesque | `clamp(2.5rem, 5vw, 4rem)` | 800 | Page titles, hero headlines |
| H2 | Bricolage Grotesque | `clamp(1.875rem, 3.5vw, 2.75rem)` | 700 | Section heads |
| H3 | Bricolage Grotesque | `clamp(1.375rem, 2vw, 1.75rem)` | 600 | Card titles, subsections |
| Body | Plus Jakarta Sans | 1rem | 400 | All body copy |
| Small | Plus Jakarta Sans | 0.875rem | 400 | Labels, metadata |
| Caps | Plus Jakarta Sans | 0.75rem | 600 | Badge labels, "uppercase" tracking |

## Elevation & Depth — Light Mode

| Layer | Shadow | Usage |
|-------|--------|-------|
| Subtle | 1px 2px 5% / 2px 4px 6% | Input fields, borders, borders |
| Light Card | 1px 2px 5% + 2px 4px 6% | Standard cards, gallery items |
| Elevated | 2px 8px 8% + 8px 24px 12% + 16px 40px 8% | Hero sections, hover cards, CTA buttons |
| Glass | Blur 12-16px + 0.8-0.85 bg opacity | Sticky nav, modals, frosted overlays |

## Structural Zones

| Zone | Background | Border | Purpose |
|------|------------|--------|---------|
| Navigation (sticky) | Glass blur 16px + white 0.85 opacity | Soft warm border 0.5 opacity | Frosted effect on light, stays above |
| Hero / Storefront | Sitter photo full-width + light warm overlay | None | Photography-first, lifestyle imagery |
| Content sections | Alternating `bg-background` / `bg-muted/20` | Subtle warm border 0.01 opacity | Rhythm, visual separation on white |
| Cards | `bg-card` white with `shadow-light-elevated` | Soft warm 0.01 opacity border | Elevation, hover lift on interaction |
| Footer | `bg-muted/30` warm | Top warm border 0.5 opacity | Grounded, not floating |
| Credentials | Soft pills (green/blue/amber tint) | Matching tint border | Professional, color-coded verification |

## Component Patterns

- **Sitter Bio Hero:** Full-width professional photo (50vh height), light overlay (gradient from transparent to near-black at 0.3), name badge + rating overlay in bottom-left, response time badge (blue pill), service area, "Currently Accepting" pill (amber), sticky header with "Book Me" button.
- **Service Pills:** Amber background cards with service name, rate, duration, icon. Grid layout on white. Subtle hover lift.
- **Credential Badges:** Soft colored pills — green for verified/insurance, blue for response time/info, amber for certifications/awards. Small icons (14px), tight 12px gap, responsive wrap.
- **Stats Card:** Glass surface white with colored accent border (amber left stripe), KPI label (caps), large value, chart sparkline.
- **Availability Calendar:** White grid cells, green dots for available, light gray for booked, today highlighted. 14-day visible span. Mobile: 2-column responsive.
- **Photo Gallery:** White background grid (3 cols on desktop, 2 on tablet, 1 on mobile), subtle card shadows, lightbox expand, gallery count badge (amber).
- **Reviews:** White cards, star ratings (amber), reviewer name + pet name, quote text, date. Filter toggleable by rating.
- **Footer CTA:** Full-width amber gradient button, "Book Me Now" text, white foreground, hover scale + shadow lift.

## Motion & Interaction

- **Page enter (light):** Fade + 8px up, 500ms ease-out. Staggered at 100ms intervals for sections. Gallery items: scale-in 300ms.
- **Card hover:** `translateY(-2px)` + shadow elevation (subtle-to-elevated), 200ms smooth.
- **Button press:** `scale(0.97)`, 150ms. Release: `scale(1)` snap.
- **Sticky header:** Appears on scroll down with slide-down animation, 300ms.
- **Glass animations:** Backdrop blur constant; opacity and transform handle entrance/exit.
- **Live indicator:** Soft pulse 3s cycle on available/new booking badges.
- **Tab switch:** Fade color 200ms, no scale jitter. Border accent slides.
- **Form input focus:** Border color shift 200ms, subtle ring glow 0.1 opacity.
- **Glass animations:** Blur constant; fade and scale handle entrance/exit.

## Spacing & Rhythm

- **Gap:** `clamp(1.5rem, 3vw, 3rem)` between sections. **Padding:** Cards `1.5rem`, hero `3–4rem`, sections `2.5–3.5rem`.
- **Grid:** 4 cols (mobile), 8 (tablet), 12 (desktop). Gutter: 1rem → 1.5rem. **Type spacing:** Headings 0.5–1rem margin, paragraphs 1.5rem, lists 0.75rem.

## Responsive Design — Light Mode Sitter Page

- **Mobile-first:** 320px baseline, 100% hero width, single column content.
- **Breakpoints:** sm: 640px (tablet prep), md: 768px (tablet), lg: 1024px (desktop), xl: 1280px (wide).
- **Safe areas:** Bottom nav respects safe-area-inset-bottom. Hero text padding safe on all notches.
- **Touch targets:** All interactive elements 48px min (tap zones). Button text readable at 16px+.
- **Hero on mobile:** 50vh height, text overlay centered bottom or top-left, "Book Me" sticky footer button (not in hero).
- **Gallery mobile:** Carousel swipe (horizontal scroll) or stacked vertically with thumbnails below.
- **Typography:** Headings scale with clamp() for fluid sizing. Paragraphs 1rem base, leading 1.7.
- **No horizontal scroll:** All content fits viewport width. Badges wrap naturally. Cards full-width minus padding.
- **Sticky header:** Appears on scroll, stays within safe-area-top-inset.

## Signature Detail

**Landing hero:** Full-bleed dog + sitter photo, dark overlay, bold headline, "no account needed" subheading, trust bar.
**Analytics:** Amber accent on values/progress. Language: "On pace for $X" + "↑ 12% from last week." Split earnings: "Your share: $X of $Y" with per-member breakdown.
**Sitter cards:** Photo hero (40%), rating overlay, glass verification badge. Co-sitter badge: avatar stack + member names + total payout.
**Booking cards:** Date/time BOLD header, service label, sitter row, pets chips, payment badge. Live: pulsing + shimmer stripe. Co-booking: overlaid avatars + "Co-sitters: Bailey & Linnea" label.
**Sitter Storefront v2:** Full hero photo of sitter, gradient overlay, name, area zone, 5-star rating badge, response time badge, certifications chips, "Currently Accepting" or "Waitlist" badge. Amber "Book Me" CTA + share icon. Pet types row (optional), promo banner (optional), stats card (happy clients, visits, repeat %), availability calendar (next 14 days), photo gallery carousel, repeat client callout, reviews section (toggleable). All sections controlled by page builder toggles in sitter profile. Sticky header with "Book Me" button on scroll.
**Teams feature:** Avatar stacks (negative-margin overlap, card-colored borders), team name + member count. Invite states: pending (primary spinner badge), accepted (green checkmark), declined (muted X). Team cards: glass-panel, split % labels. Collaboration: Slack-like bubbles (sent right/amber primary, received left/card bg), typing indicator (pulsing dots), duty threads (assigned/in-progress/done states). Split earnings: glass card showing "Your share: $X" in accent, "Total: $Y", per-member breakdown row.

## Sitter Storefront v2 — Page Structure

| Section | Component | Toggleable | Notes |
|---------|-----------|-----------|-------|
| Hero | Photo + overlay + name + area + rating + badges | — | Always visible; core trust signal |
| Pet Types | Icon badge row (dog, cat, bird, etc.) | Yes | Hide if empty |
| Promo Banner | Amber card with offer code | Yes | Hide if no active deal |
| Booking Stats | Glass card: Happy Clients / Visits / Repeat % | Yes | KPI display with gradients |
| Services | Grid of services (existing) | — | Always visible |
| Availability Calendar | 14-day calendar, visual dots | Yes | Green: available, gray: booked |
| Photo Gallery | Horizontal carousel with lightbox | Yes | From visit photos + uploads |
| Certifications | Chip badges (Pet First Aid, Fear Free) | Yes | Hide if empty |
| Repeat Client Callout | Amber accent card with count | Yes | Hide if no repeat clients |
| Reviews | Review cards (existing) | Yes | Hide if sitter opts out |

## Sitter Profile Settings — Page Builder Controls

| Field | Type | Location | Default |
|-------|------|----------|---------|
| Response Time | Dropdown (< 1hr / 1-2hrs / 2-4hrs / 4-24hrs) | Profile Settings | "2-4 hours" |
| Pet Types Served | Multi-select checkboxes (dogs, cats, birds, rabbits, etc.) | Profile Settings | Empty array |
| Certifications | Multi-select checkboxes (Pet First Aid, Fear Free, IAABC, etc.) | Profile Settings | Empty array |
| Accepting New Clients | Toggle (on/off) | Profile Settings | On |
| Page Components Visibility | Checklist (Pet Types / Promo / Stats / Calendar / Gallery / Certs / Repeat / Reviews) | Profile Settings → Page Builder | All checked |
| Gallery Photo Upload | Multi-file upload with legal consent (3-part) | Profile Settings → Photos | — |

## Photo Upload — Legal Consent Flow

All gallery uploads trigger a 3-part consent modal:
1. "I confirm these photos show actual pet visits and client interactions" — checkbox
2. "I own/have permission to use these photos and release Pawspect from liability" — checkbox
3. "I understand Pawspect does not verify photo authenticity or client approval" — checkbox

On accept, photo uploaded to object storage. On decline, upload cancelled. Modal appears once per session or every upload (TBD by PM).

## Teams Feature Styling

| Component | Token | Usage |
|-----------|-------|-------|
| Avatar stack | `card` border, `-space-x-3` | 3-4 overlapped sitter avatars with team identity |
| Team card | `glass-panel` + `space-y-4` | Team summary: name, members, split labels |
| Split badge | `accent / 0.15` bg, `accent / 0.25` border | "70% • Bailey", "20% • Linnea" on team card |
| Invite pending | `primary / 0.1` bg, `primary` text | Pending state with spinner icon |
| Invite accepted | `0.55 0.15 130 / 0.15` bg (green) | Checkmark + "Member since [date]" |
| Invite declined | `muted / 0.5` bg, muted text | Grayed X + "Declined" |
| Chat sent | `primary` bg, `primary-foreground` text | User's message, right-aligned |
| Chat received | `card` bg, `foreground` text + border | Team member message, left-aligned |
| Duty assigned | `accent / 0.12` bg, `accent` border | "Assigned to Bailey" chip |
| Duty in-progress | `accent / 0.2` bg, `accent / 0.35` border + glow | Active work, subtle shadow enhancement |
| Duty done | Green `0.55 0.15 130` | Completed task state |
| Co-sitter badge | `accent / 0.1` bg, `accent` text | Booking card label for team bookings |
| Split earnings | `glass-panel`, accent amount | "Your share: $180 of $270 total" |

## Constraints

- ✓ OKLCH tokens only; semantic names; no raw hex or arbitrary Tailwind classes
- ✓ Dark mode intentional; glassmorphism on nav/cards/modals only; premium shadows only
- ✓ H1/H2/H3 hierarchy strict: Bricolage for display, Plus Jakarta for body
- ✓ WCAG AA+ contrast; mobile-first; no horizontal scroll; no duplicate messaging
- ✓ Booking cards scannable at volume: date/time prominent, service, sitter, pets, status all visible without expand
- ✓ Book Again cards accent-forward, distinct from history, top 2–3 shortcuts only
- ✓ Live bookings: pulsing indicator + shimmer stripe + real-time status
- ✓ Page builder: all sections toggleable; hide if empty (no fake data); video upload removed entirely
- ✓ Teams: avatar stacks with negative margin, invite lifecycle clear (pending/accepted/declined), chat bubbles consistent with messaging UX, split earnings always visible and trustworthy, no ambiguity on payouts
