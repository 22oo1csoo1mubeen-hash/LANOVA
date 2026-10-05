# LANOVA — Design System & UI Implementation Guidelines

> **Purpose:** This document defines the complete visual design system, layout rules, styling standards, component appearance and responsive behavior for LANOVA. Every frontend implementation must follow these guidelines consistently.

> **Design reference:** Use the provided LANOVA landing page, login page, registration page, chat interface and network information dashboard reference images. Match their visual language as closely as possible. Do not introduce a different theme or redesign the interface independently.

---

# 1. Design Philosophy

LANOVA is a modern, futuristic, dark-themed LAN messaging application.

The interface should feel:

* Premium
* Minimal
* Futuristic
* Clean
* Elegant
* Technically sophisticated
* Responsive
* Consistent

The visual identity is built around:

* Deep black and dark charcoal backgrounds.
* Electric lime-green accents.
* Glossy metallic green abstract elements.
* Subtle green ambient lighting.
* Premium glassmorphism.
* Soft neon glows.
* Large, bold, modern typography.
* Carefully balanced spacing and positioning.

The design should resemble a high-end modern SaaS product with a futuristic aesthetic.

## Core visual principle

**Darkness creates depth. Green creates focus. Glass creates hierarchy. Light creates atmosphere.**

Do not overuse glow, gradients, borders or animations. Every visual effect should serve a purpose.

---

# 2. Color System

Colors must remain consistent across all pages.

Use the following design tokens as the source of truth.

## 2.1 Primary Colors

| Token                | Hex       | Usage                               |
| -------------------- | --------- | ----------------------------------- |
| Primary Background   | `#080A08` | Main application background         |
| Secondary Background | `#0D100D` | Secondary surfaces                  |
| Tertiary Background  | `#141814` | Elevated cards and panels           |
| Surface              | `#191D19` | Input fields and subtle surfaces    |
| Primary Lime         | `#B7F52B` | Primary buttons and highlights      |
| Bright Lime          | `#C8FF42` | Hover states and intense accents    |
| Deep Lime            | `#78A91C` | Subtle green borders and gradients  |
| Green Glow           | `#9CFF00` | Ambient glow and selected effects   |
| White                | `#F5F7F3` | Primary text                        |
| Secondary Text       | `#A6AAA3` | Descriptions and supporting content |
| Muted Text           | `#737970` | Hints and disabled text             |
| Border               | `#30362E` | Default borders                     |
| Divider              | `#252A24` | Separators                          |

## 2.2 Color Usage Rules

### Background

* Use `#080A08` as the dominant background.
* Avoid pure black (`#000000`) across large surfaces.
* Introduce very subtle radial gradients for depth.
* Keep central content areas darker and visually calm.
* Allow abstract green lighting near the edges.

Example:

```css
background:
  radial-gradient(
    ellipse at 50% 45%,
    rgba(55, 75, 28, 0.12),
    transparent 65%
  ),
  #080A08;
```

### Primary Lime

Use `#B7F52B` for:

* Main call-to-action buttons.
* Active navigation indicators.
* Selected tabs.
* Online indicators.
* Important highlighted text.
* Small decorative accents.

Do not use lime for large blocks of body text.

### Text

* Main headings: `#F5F7F3`
* Supporting text: `#A6AAA3`
* Metadata: `#737970`
* Highlighted text: `#B7F52B`

Maintain strong contrast and readability.

---

# 3. Typography

Typography is a major part of LANOVA's identity.

Use a modern geometric sans-serif font family.

## 3.1 Font Family

**Primary font: Manrope**

Import from Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
```

Fallback:

```css
font-family: 'Manrope', Inter, system-ui, sans-serif;
```

Use Manrope consistently throughout the application.

Avoid mixing multiple unrelated font families.

## 3.2 Typography Scale

| Element         | Desktop Size | Weight  | Line Height |
| --------------- | ------------ | ------- | ----------- |
| Hero heading    | 64–76px      | 800     | 1.05        |
| Page heading    | 38–44px      | 800     | 1.15        |
| Section heading | 24–30px      | 700     | 1.25        |
| Card heading    | 18–22px      | 700     | 1.4         |
| Body text       | 15–17px      | 400–500 | 1.6         |
| Navigation      | 15–17px      | 600     | 1.4         |
| Button text     | 14–16px      | 700     | 1.2         |
| Labels          | 13–14px      | 600     | 1.4         |
| Metadata        | 11–13px      | 500     | 1.4         |

## 3.3 Typography Rules

* Use bold uppercase text for prominent hero headings.
* Use lime-green highlights within important headings.
* Use moderate letter spacing for short uppercase labels.
* Avoid excessive letter spacing in paragraphs.
* Use `font-weight: 800` for large display text.
* Use `font-weight: 600` for navigation and interface labels.
* Maintain clear visual hierarchy.
* Prevent text from overlapping or clipping.

On mobile, reduce heading sizes proportionally rather than allowing horizontal overflow.

---

# 4. Background and Ambient Lighting

The background is one of LANOVA's defining visual elements.

It should reproduce the dark, glossy, neon-green atmosphere of the supplied references.

## 4.1 Base Background

Use a deep charcoal-black background with subtle lighting.

```css
background-color: #080A08;
```

Add layered radial gradients:

```css
background-image:
  radial-gradient(
    ellipse at 8% 30%,
    rgba(145, 255, 35, 0.12),
    transparent 35%
  ),
  radial-gradient(
    ellipse at 95% 70%,
    rgba(135, 255, 25, 0.10),
    transparent 38%
  ),
  radial-gradient(
    ellipse at 50% 50%,
    rgba(30, 40, 25, 0.18),
    transparent 70%
  );
```

These should remain subtle.

## 4.2 Abstract Background Elements

The landing and authentication pages should feature glossy, curved, metallic green forms along the left and right edges.

Implementation options:

* Use the provided generated background image.
* Use carefully created SVG artwork.
* Use CSS gradients and blurred shapes for a simplified effect.

Prefer the generated background image when it is available in the project assets.

Background requirements:

* Keep the center relatively dark.
* Place large reflective forms along the sides.
* Use green and silver highlights.
* Maintain sufficient contrast behind text and cards.
* Use `background-size: cover`.
* Use `background-position: center`.
* Prevent unwanted tiling.
* Ensure mobile layouts retain a clean central area.

Do not generate unrelated decorative shapes for every page.

## 4.3 Ambient Glow

Use a subtle green glow behind selected elements.

Example:

```css
box-shadow:
  0 0 30px rgba(156, 255, 0, 0.08),
  0 0 80px rgba(156, 255, 0, 0.04);
```

Glows should be visible but never overpower the interface.

Avoid excessive neon outlines and large saturated green shadows.

---

# 5. Glassmorphism

Glassmorphism is a central design feature in LANOVA.

Glass surfaces should feel dark, translucent, layered and premium.

## 5.1 Glass Card

Standard glass card:

```css
.glass-card {
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.055),
      rgba(255, 255, 255, 0.015)
    );

  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);

  border: 1px solid rgba(180, 255, 90, 0.16);

  border-radius: 22px;

  box-shadow:
    0 12px 45px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

## 5.2 Glassmorphism Rules

* Use dark translucent surfaces rather than white frosted glass.
* Apply moderate backdrop blur.
* Add subtle green-tinted borders.
* Use soft internal highlights.
* Keep card backgrounds sufficiently opaque for readability.
* Use layered surfaces to distinguish panels.
* Avoid making every small element glassmorphic.

## 5.3 Glass Surface Hierarchy

| Surface          | Blur | Background Opacity | Border           |
| ---------------- | ---- | ------------------ | ---------------- |
| Main glass panel | 22px | Low to medium      | Subtle green     |
| Secondary card   | 16px | Medium             | Neutral or green |
| Input field      | 8px  | Medium to high     | Neutral          |
| Floating tooltip | 12px | High               | Subtle           |
| Navigation bar   | 16px | Medium             | Bottom divider   |

On pages containing many messages or dense data, prefer more opaque backgrounds to maintain readability.

---

# 6. Glow System

Glow must be controlled and consistent.

## 6.1 Primary Button Glow

```css
box-shadow:
  0 0 18px rgba(183, 245, 43, 0.20),
  0 0 45px rgba(183, 245, 43, 0.08);
```

## 6.2 Active Element Glow

```css
box-shadow:
  0 0 12px rgba(183, 245, 43, 0.18),
  inset 0 0 12px rgba(183, 245, 43, 0.04);
```

## 6.3 Online Status Glow

```css
.online-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #B7F52B;

  box-shadow:
    0 0 7px rgba(183, 245, 43, 0.75);
}
```

## 6.4 Glow Rules

* Apply glow primarily to important actions and active states.
* Keep glow soft and diffused.
* Use small glows for status indicators.
* Avoid applying intense glow to every card and border.
* Do not use animated pulsing by default.
* Use brighter glow on hover only when appropriate.

The goal is sophisticated lighting, not an overloaded gaming interface.

---

# 7. Spacing and Layout System

Consistent spacing is essential.

Use a spacing scale based on multiples of 4px.

| Token      | Value |
| ---------- | ----- |
| `space-1`  | 4px   |
| `space-2`  | 8px   |
| `space-3`  | 12px  |
| `space-4`  | 16px  |
| `space-5`  | 20px  |
| `space-6`  | 24px  |
| `space-8`  | 32px  |
| `space-10` | 40px  |
| `space-12` | 48px  |
| `space-16` | 64px  |
| `space-20` | 80px  |

Use the same scale for padding, margins, gaps and alignment.

## 7.1 Positioning Principles

* Use Flexbox and CSS Grid for layout.
* Avoid absolute positioning for primary layout structures.
* Use absolute positioning only for decorative elements and small overlays.
* Align major sections using shared containers.
* Maintain consistent left and right page margins.
* Keep card edges and section boundaries aligned.
* Prevent accidental horizontal scrolling.
* Maintain predictable vertical spacing.

## 7.2 Content Width

For the landing page:

```css
max-width: 1440px;
margin-inline: auto;
```

For authentication:

```css
width: min(100% - 32px, 520px);
```

For the main application:

* Use a full-height application shell.
* Keep the header height consistent.
* Allocate sufficient width to the sidebar and main content.
* Avoid unnecessarily narrow chat panels.

---

# 8. Landing Page Design

The landing page is the visual introduction to LANOVA.

It should closely follow the provided reference.

## 8.1 Header

Structure:

* LANOVA wordmark on the left.
* Navigation links in the center.
* Open App button on the right.

Header specifications:

* Height: approximately 84px.
* Horizontal padding: 4–6vw.
* Background: translucent near-black.
* Bottom border: subtle dark gray.
* Position: top of page.
* Wordmark: bright lime, bold uppercase.
* Navigation: light gray.
* CTA: transparent with lime outline.

Use a clean, balanced layout.

## 8.2 Hero Section

The hero should occupy most of the initial viewport.

Structure:

1. Small uppercase tagline.
2. Large, bold central heading.
3. Short descriptive paragraph.
4. Primary CTA.
5. Supporting microcopy.

Suggested copy:

**Tagline**

`PRIVATE. LOCAL. INSTANT.`

**Heading**

`MESSAGING, BUILT`

`FOR YOUR NETWORK.`

Highlight the second line in lime.

**Description**

`Connect locally. Communicate instantly.`

`A simple, real-time chat that works across your LAN.`

**CTA**

`Explore LANOVA ↗`

**Supporting text**

`No cloud. No clutter. Just your local network.`

## 8.3 Hero Positioning

* Center all hero content horizontally.
* Keep the heading as the visual focal point.
* Use sufficient space between the tagline, heading, paragraph and button.
* Keep the center visually uncluttered.
* Use side lighting to frame the content.
* Do not insert unrelated images or unnecessary illustrations into the hero.

The initial landing page should be a single hero section only.

---

# 9. Login and Registration Design

Login and registration share the same visual system and background.

## 9.1 Page Structure

* Full viewport height.
* Centered content.
* LANOVA wordmark above the card.
* Small uppercase tagline.
* Centered glassmorphism authentication card.
* Ambient green background lighting.

## 9.2 Authentication Card

Recommended dimensions:

* Width: 520px maximum.
* Padding: 48–56px on desktop.
* Border radius: 24px.
* Background: dark translucent glass.
* Border: subtle green-tinted line.
* Blur: 22px.

On smaller screens, use 20–24px internal padding.

## 9.3 Tabs

Two tabs:

* Login
* Register

Appearance:

* Equal width.
* Muted gray for inactive tabs.
* Lime text for the active tab.
* Thin lime underline for the active tab.
* Smooth transitions.

## 9.4 Input Fields

Input appearance:

```css
.auth-input {
  width: 100%;
  min-height: 64px;

  background: rgba(15, 17, 15, 0.78);

  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 17px;

  color: #F5F7F3;

  padding: 0 20px;

  font: inherit;

  outline: none;

  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}
```

Input requirements:

* Dark translucent background.
* Rounded corners.
* Subtle border.
* Comfortable input height.
* Clear placeholder text.
* Proper focus state.
* Optional leading icons.
* Password visibility toggle where appropriate.

Focus state:

```css
.auth-input:focus {
  border-color: #B7F52B;

  box-shadow:
    0 0 0 3px rgba(183, 245, 43, 0.08),
    0 0 18px rgba(183, 245, 43, 0.08);
}
```

## 9.5 Authentication Buttons

Primary buttons should:

* Occupy the full card width.
* Have a lime gradient or solid lime background.
* Use dark text.
* Have rounded pill-like corners.
* Include an optional right-aligned arrow icon.
* Have a subtle glow.
* Provide clear hover and disabled states.

Use a consistent button height of approximately 64px.

## 9.6 Login Page

Fields:

* Username
* Password

Additional elements:

* Password visibility toggle.
* Login button.
* Registration link.

Do not include social login or password recovery in the MVP unless the backend requirements later support them.

## 9.7 Registration Page

Fields:

* Username
* Password
* Confirm Password

Additional elements:

* Password visibility toggles.
* Register button.
* Login link.

Keep the card proportions visually consistent with the login screen while allowing the extra field.

---

# 10. Main Chat Application Layout

The main application should follow the provided LANOVA chat interface reference.

Unlike the authentication pages, the main chat interface should prioritize usability and information density.

## 10.1 Application Shell

Use a full-height dark application shell with:

* Top navigation bar.
* Left user and conversation sidebar.
* Central chat panel.
* Optional network information panel.

The overall interface should use subtle glass surfaces rather than making every panel highly transparent.

## 10.2 Top Navigation

Elements:

* LANOVA wordmark on the left.
* Current user profile on the right.
* Online indicator.
* Settings icon if needed.
* Logout button.

Recommended height: 80–84px.

Use a subtle bottom border.

## 10.3 Sidebar

Recommended desktop width: 320–360px.

Elements:

* Search input.
* Users and Chats tabs.
* User list.
* Avatar or initials.
* Username.
* Online/offline indicator.
* Recent conversation preview where applicable.

Selected user:

* Slightly brighter background.
* Lime border or left indicator.
* Very subtle green glow.

Unselected users:

* Transparent background.
* Neutral text.
* Subtle hover background.

Do not use bright green backgrounds for every user row.

## 10.4 Chat Panel

The central chat panel should occupy the largest available area.

Structure:

1. Conversation header.
2. Message history.
3. Message composer.

### Conversation Header

Display:

* Recipient avatar or initials.
* Username.
* Online/offline status.
* Optional conversation actions.

Keep the header compact.

### Message History

* Use a scrollable container.
* Align outgoing messages to the right.
* Align incoming messages to the left.
* Use distinct message bubble backgrounds.
* Display timestamps in muted text.
* Use a subtle date separator where needed.
* Maintain consistent vertical gaps.

Outgoing messages:

```css
background: linear-gradient(
  135deg,
  #C8FF42,
  #B7F52B
);

color: #11150B;
```

Incoming messages:

```css
background: rgba(255, 255, 255, 0.075);

color: #F5F7F3;

border: 1px solid rgba(255, 255, 255, 0.06);
```

Message bubbles should have a maximum width of approximately 70% of the chat area.

Avoid oversized bubbles.

### Message Composer

* Fixed at the bottom of the chat panel.
* Rounded input container.
* Dark translucent surface.
* Message input.
* Circular or pill-shaped send button.
* Lime accent for the send action.

Maintain sufficient bottom spacing.

On mobile, ensure the composer remains accessible and does not cover messages.

---

# 11. Network Information Page

The network information page should reuse the main application shell.

It should resemble a modern technical dashboard without becoming a complex monitoring product.

## 11.1 Layout

* Left navigation sidebar.
* Top user header.
* Main content area.
* Page title and description.
* Network status badge.
* Information cards.
* Connection details section.

## 11.2 Page Header

Title:

`Network Information`

Highlight `Information` in lime.

Subtitle:

`Your local server details and real-time connection status.`

Place a connection status badge near the top-right on desktop.

## 11.3 Information Cards

Use a responsive two-column grid on desktop.

Cards:

**LAN IP Address**

* Monitor icon.
* Local IP address.
* Copy action.
* Short explanatory text.

**Server Port**

* Server icon.
* Configured server port.
* Copy action.
* Short explanatory text.

**WebSocket Status**

* Connection icon.
* Connected/disconnected state.
* Status description.

**Active Users**

* Users icon.
* Number of connected users.
* Navigation or action to view users if implemented.

Cards should have:

* Dark green-tinted surfaces.
* Subtle green borders.
* Rounded corners.
* Moderate padding.
* Small icon containers.
* Consistent title and value hierarchy.

Do not hardcode sample IP addresses or active user counts in the final integrated version. Display real values supplied by the backend.

## 11.4 Connection Details

Display a compact details panel containing:

* Protocol.
* Connection type.
* Local IP.
* Server port.
* WebSocket URL.

## 11.5 Connection Status

Display the status of:

* Backend server.
* Database.
* WebSocket connection.
* Current client connection.

Use small colored status indicators and text labels.

Never show a service as connected unless its state is actually verified.

---

# 12. Buttons and Interactive Elements

All buttons and interactive elements must have consistent behavior and appearance.

## 12.1 Primary Button

```css
.btn-primary {
  background: linear-gradient(
    135deg,
    #C8FF42,
    #B7F52B
  );

  color: #11150B;

  border: none;
  border-radius: 999px;

  font-weight: 700;

  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}
```

Hover:

* Slight brightness increase.
* Subtle glow.
* Small upward movement.

Active:

* Slightly reduce the scale.
* Avoid dramatic movement.

## 12.2 Secondary Button

* Transparent background.
* Subtle gray or green border.
* White or lime text.
* Slight background highlight on hover.

## 12.3 Icon Buttons

* Circular or softly rounded shape.
* Consistent icon size.
* Subtle hover background.
* Clear focus outline.
* Accessible tooltip or label where needed.

Use Lucide React icons for consistent iconography.

Avoid mixing multiple icon libraries.

---

# 13. Borders, Radius and Shadows

Maintain a consistent shape language.

## 13.1 Border Radius

| Element         | Radius        |
| --------------- | ------------- |
| Large panels    | 22–26px       |
| Cards           | 18–22px       |
| Input fields    | 14–18px       |
| Buttons         | 999px or 14px |
| Message bubbles | 16–20px       |
| Small badges    | 999px         |
| Icon containers | 50% or 14px   |

## 13.2 Borders

Default:

```css
border: 1px solid rgba(255, 255, 255, 0.08);
```

Active:

```css
border: 1px solid rgba(183, 245, 43, 0.55);
```

Use brighter borders sparingly.

## 13.3 Shadows

Standard card shadow:

```css
box-shadow:
  0 10px 35px rgba(0, 0, 0, 0.25);
```

Elevated panel:

```css
box-shadow:
  0 18px 50px rgba(0, 0, 0, 0.35),
  0 0 25px rgba(183, 245, 43, 0.035);
```

Avoid heavy shadows that obscure the dark background.

---

# 14. Animations and Transitions

Animations should be subtle and purposeful.

Use short transitions for:

* Button hover states.
* Tab switching.
* Input focus.
* Sidebar selection.
* Panel appearance.
* Status indicator changes.
* Message appearance.

Suggested durations:

| Interaction      | Duration |
| ---------------- | -------- |
| Button hover     | 180ms    |
| Input focus      | 180ms    |
| Tab transition   | 220ms    |
| Card hover       | 200ms    |
| Page transition  | 250ms    |
| Message entrance | 180ms    |

Use ease-out or ease-in-out easing.

Avoid:

* Excessive parallax.
* Constant pulsing across the interface.
* Large animated background objects.
* Long page transitions.
* Animations that interfere with typing or scrolling.

Respect `prefers-reduced-motion`.

---

# 15. Responsive Design

LANOVA must be responsive across desktop, tablet and mobile devices.

## 15.1 Breakpoints

| Device       | Breakpoint       |
| ------------ | ---------------- |
| Mobile       | Below 640px      |
| Tablet       | 640px–1023px     |
| Desktop      | 1024px and above |
| Wide desktop | 1440px and above |

## 15.2 Landing Page

Desktop:

* Full navigation.
* Large central hero heading.
* Side background elements.
* Centered CTA.

Tablet:

* Reduced heading size.
* Reduced side lighting.
* Adjusted horizontal spacing.

Mobile:

* Compact header.
* Hide or collapse secondary navigation.
* Smaller hero heading.
* Maintain readable paragraph width.
* Reduce or hide decorative side effects if they obscure content.
* Full-width or near-full-width CTA where appropriate.

## 15.3 Authentication Pages

Desktop:

* Centered card with ample surrounding space.

Tablet:

* Slightly narrower card.
* Reduced outer spacing.

Mobile:

* Full-width card with small side margins.
* Reduced internal padding.
* Smaller logo and tagline.
* Scrollable page when required.
* No horizontal overflow.

## 15.4 Chat Application

Desktop:

* Sidebar and chat panel side by side.
* Network information panel may appear alongside the chat where space permits.

Tablet:

* Sidebar may become narrower.
* Network panel can be moved to a separate page.

Mobile:

* Use a single-panel navigation flow.
* Show the user list first.
* Open the conversation as a separate full-screen view.
* Place network information in a dedicated screen.
* Keep the message composer accessible.
* Ensure the back-navigation behavior is clear.

Do not attempt to compress the entire desktop dashboard into a small mobile viewport.

---

# 16. Accessibility

Maintain basic accessibility standards.

* Use semantic HTML.
* Associate labels with form fields.
* Provide keyboard navigation.
* Include visible focus states.
* Use accessible contrast for text and controls.
* Provide accessible labels for icon-only buttons.
* Ensure status is not communicated through color alone.
* Use appropriate button and input elements.
* Avoid motion that cannot be disabled.
* Ensure form validation errors are understandable.

---

# 17. Code and Styling Architecture

Keep the frontend modular and maintainable.

Suggested structure:

```text
frontend/
├── public/
│   └── assets/
│       └── lanova-background.png
│
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── UserList.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── NetworkCard.jsx
│   │   └── StatusIndicator.jsx
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── ChatPage.jsx
│   │   └── NetworkPage.jsx
│   │
│   ├── layouts/
│   │   └── AppLayout.jsx
│   │
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   ├── components.css
│   │   └── responsive.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
└── package.json
```

This is a suggested structure. Adjust it only when there is a clear implementation benefit.

## Styling Rules

* Centralize design tokens.
* Avoid duplicating CSS values.
* Use reusable components.
* Avoid excessive inline styles.
* Keep component styles organized.
* Separate global styles from page-specific styles.
* Avoid introducing unnecessary UI libraries.
* Do not mix inconsistent styling conventions.

---

# 18. Design Tokens

Use centralized CSS variables.

```css
:root {
  /* Backgrounds */
  --color-bg: #080A08;
  --color-bg-secondary: #0D100D;
  --color-bg-tertiary: #141814;
  --color-surface: #191D19;

  /* Brand */
  --color-primary: #B7F52B;
  --color-primary-bright: #C8FF42;
  --color-primary-dark: #78A91C;
  --color-glow: #9CFF00;

  /* Text */
  --color-text-primary: #F5F7F3;
  --color-text-secondary: #A6AAA3;
  --color-text-muted: #737970;

  /* Borders */
  --color-border: #30362E;
  --color-divider: #252A24;

  /* Radius */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-xl: 26px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-card:
    0 10px 35px rgba(0, 0, 0, 0.25);

  --shadow-glow:
    0 0 18px rgba(183, 245, 43, 0.20),
    0 0 45px rgba(183, 245, 43, 0.08);

  /* Typography */
  --font-primary: 'Manrope', Inter, system-ui, sans-serif;

  /* Transitions */
  --transition-fast: 180ms ease;
  --transition-normal: 220ms ease;
  --transition-slow: 300ms ease;
}
```

All pages should consume these tokens.

---

# 19. Strict Design Constraints

The following rules must be followed during implementation.

1. Do not change the LANOVA visual identity.
2. Do not introduce blue, purple, orange or unrelated accent colors.
3. Do not use pure white card backgrounds.
4. Do not overuse neon effects.
5. Do not use excessive glass blur.
6. Do not make every panel equally prominent.
7. Do not add unnecessary decorative illustrations.
8. Do not introduce extra landing page sections unless requested.
9. Do not change the typography without a clear technical reason.
10. Do not use inconsistent spacing between similar components.
11. Do not allow text, buttons or cards to overlap.
12. Do not hardcode backend-derived network information in the integrated application.
13. Do not display fake online statuses or connection states in production.
14. Do not sacrifice usability for visual effects.
15. Do not implement the reference screenshots as static images. Recreate the actual UI using React components and CSS.
16. Do not use absolute positioning to imitate the entire reference layout.
17. Do not change the design of one page independently from the shared design system.
18. Do not add unnecessary features beyond the agreed MVP.

---

# 20. Final Implementation Directive

Before implementing any page:

1. Review the available LANOVA design reference images.
2. Read this entire design document.
3. Identify the relevant shared design tokens and components.
4. Recreate the layout and visual hierarchy of the corresponding reference.
5. Use consistent colors, typography, spacing, borders, shadows and glow.
6. Verify the design at desktop and mobile sizes.
7. Check alignment, responsiveness, text overflow and contrast.
8. Ensure all visual elements are real frontend components rather than static screenshot replacements.

**Priority order:**

1. Accurate layout and positioning.
2. Accurate colors and typography.
3. Correct glassmorphism and lighting.
4. Clear visual hierarchy.
5. Responsive behavior.
6. Subtle animations and finishing details.

**Final design goal:**

LANOVA should feel like a premium, futuristic communication product with a distinctive dark and neon-green visual identity. Every page must look like part of the same product, with precise alignment, controlled lighting, refined glass surfaces and a clean, highly usable interface.
