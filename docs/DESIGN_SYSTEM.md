# Aidvans Healthcare Financing LSP - Design System (DESIGN_SYSTEM.md)

This specification defines the visual standards, tokenized values, and plain banking aesthetic for the Aidvans Healthcare Financing Lending Service Platform (v2.0).

---

## 1. Core Visual Principles
- **No Decoration**: High-density, utilitarian banking UI designed for hospital desks, operations teams, and mobile borrowers.
- **Pure White Background**: `--bg-page: #ffffff` throughout the application.
- **System Font Stack**: Zero external font CDNs or web fonts. Uses system fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Zero Forbidden Elements**:
  - Zero box-shadows (`box-shadow: none`).
  - Zero CSS gradients (`background-image: linear-gradient(...)` prohibited).
  - Zero emojis in rendered DOM or code.
  - Zero marketing buzzwords ("instant approval", "guaranteed sanction", etc.).
  - Zero occurrences of the word "Paid".

---

## 2. Tokenized Scales

### 2.1 Spacing Scale (4px Base Unit)
- `4px`: Minimal inline badge padding, tightly coupled icons
- `8px`: Standard element gap, compact button padding
- `12px`: Group gap, card inner padding (compact)
- `16px`: Form group margins, standard card padding, base layout gap
- `20px`: Major section separation
- `24px`: Main container padding, top bar height offset
- `32px`: Page header margin
- `40px`: Large section offset

### 2.2 Typography Scale
- `11px`: Footnotes, statutory regulatory disclaimers
- `12px`: Small badges, secondary timestamps, breadcrumbs, table metadata
- `13px`: Subtitle text, helper text, dense queue summaries
- `14px`: Base body text, table cells, form input text, button labels
- `16px`: H3 headings, modal titles, form field labels, primary highlights
- `20px`: H2 headings, stat KPI values
- `24px`: H1 page headings, major brand titles

### 2.3 Color Palette
- Canvas Background: `#ffffff`
- Subtle Background: `#f8fafc`
- Neutral Muted: `#f1f5f9`
- Main Typography: `#111111`
- Muted Typography: `#475569`
- Subtle Typography: `#64748b`
- Border Light: `#e2e8f0`
- Border Main: `#cbd5e1`
- Border Dark: `#94a3b8`
- Primary Brand Blue: `#1e3a8a` (Deep Navy)
- Primary Subtle: `#eff6ff`
- Success Emerald: `#15803d`
- Success Subtle: `#f0fdf4`
- Warning Amber: `#b45309`
- Warning Subtle: `#fffbeb`
- Danger Crimson: `#b91c1c`
- Danger Subtle: `#fef2f2`
- Royal Purple: `#6b21a8`

---

## 3. Component Hierarchy

### 3.1 Buttons
- **Primary Button**: Deep Navy background (`#1e3a8a`), white text, 2px border radius, min-height 44px (touch accessible).
- **Secondary Button**: White background, neutral border (`#cbd5e1`), dark text.
- **Danger Button**: Crimson background (`#b91c1c`), white text, used strictly for destructive or closure actions.

### 3.2 Badges & Status Pills
- High-contrast 2px rounded status pills with 1px solid border and tinted background:
  - `badge-blue`: In progress, active, submitted
  - `badge-emerald`: Confirmed, verified, authorized
  - `badge-amber`: Action required, pending review, discrepancy
  - `badge-danger`: Rejected, cancelled, reversed, locked
  - `badge-purple`: Admin, compliance, statutory records

### 3.3 Tables
- Dense, left-aligned layout with `#f8fafc` header, 1px `#e2e8f0` dividers, and subtle row hover. No decorative cards where a data table is appropriate.

### 3.4 Modals & Toasts
- Accessible keyboard-trapped modal dialogs with backdrop overlay (`rgba(0,0,0,0.5)`).
- Plain corner toasts for non-blocking notifications, automatically clearing after 4 seconds.
