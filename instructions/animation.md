# LANOVA — Animation & Motion Design Guidelines

> **Purpose:** This document defines the animation system, transitions, motion behavior, page entrances, interactive effects, and loading experiences for LANOVA.
>
> **Design reference:** Follow the futuristic, premium, dark-themed, neon-green visual identity defined in `design.md`.
>
> **Core principle:** Every interaction should feel smooth, responsive, intentional, and visually refined. Animations should improve the user experience rather than distract from it.

---

# 1. Animation Philosophy

LANOVA should have a sophisticated motion language.

The application should feel:

* Smooth
* Fluid
* Responsive
* Premium
* Modern
* Subtle
* Consistent
* Natural

Animations must reinforce the visual hierarchy and help users understand what is happening.

### Core Motion Principles

1. **Smoothness:** All animations should use appropriate easing curves.
2. **Consistency:** Similar interactions should have similar motion behavior.
3. **Purpose:** Every animation must serve a functional or visual purpose.
4. **Subtlety:** Avoid unnecessarily dramatic movements.
5. **Responsiveness:** Interactions should respond immediately to user actions.
6. **Performance:** Prefer GPU-friendly CSS properties.
7. **Accessibility:** Respect reduced-motion preferences.
8. **Continuity:** Navigation and state changes should feel connected rather than abrupt.

### Overall Motion Identity

LANOVA should use:

* Gentle fade-ins.
* Small vertical slide-ins.
* Smooth scale transitions.
* Subtle green glow transitions.
* Soft hover elevation.
* Fluid page transitions.
* Carefully timed staggered entrances.
* Refined loading indicators.

Avoid excessive bouncing, spinning, flashing, shaking, or constantly moving decorative elements.

---

# 2. Animation Technology

Use CSS transitions and keyframe animations for most motion effects.

Recommended tools:

| Technology               | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| CSS Transitions          | Hover, focus, active states and simple state changes                  |
| CSS Keyframes            | Loading indicators, entrance effects and ambient animations           |
| React                    | Trigger animation states and manage component lifecycle               |
| Framer Motion (optional) | Complex page transitions, layout animations and coordinated sequences |

### Implementation Preference

Use native CSS animations for simple effects.

Use Framer Motion only if it materially simplifies complex page transitions or coordinated animations.

Do not introduce multiple animation libraries.

Keep animations lightweight and easy to maintain.

---

# 3. Global Motion Tokens

Centralize durations, easing functions and common motion values.

```css
:root {
  /* Durations */
  --duration-instant: 100ms;
  --duration-fast: 160ms;
  --duration-normal: 220ms;
  --duration-medium: 320ms;
  --duration-slow: 450ms;
  --duration-page: 500ms;

  /* Easing */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* Movement */
  --motion-distance-xs: 4px;
  --motion-distance-sm: 8px;
  --motion-distance-md: 16px;
  --motion-distance-lg: 24px;

  /* Scale */
  --scale-hover: 1.02;
  --scale-pressed: 0.98;

  /* Common transitions */
  --transition-ui:
    220ms var(--ease-standard);

  --transition-hover:
    180ms var(--ease-out);

  --transition-page:
    450ms var(--ease-emphasized);
}
```

Use these tokens instead of defining arbitrary animation durations in every component.

---

# 4. Page Entrance Animations

Every main page should have a smooth entrance when opened.

This applies to:

* Landing page.
* Login page.
* Registration page.
* Users and chat list.
* Chat page.
* Network information page.

Page entrances should establish visual hierarchy without delaying access to the interface.

## 4.1 Standard Page Entrance

Use a combination of opacity and a small vertical movement.

```css
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-enter {
  animation:
    page-enter 450ms
    cubic-bezier(0.2, 0.8, 0.2, 1)
    both;
}
```

### Rules

* Use a duration between 350ms and 500ms.
* Keep vertical movement between 8px and 16px.
* Avoid large zoom effects.
* Do not introduce noticeable loading delays.
* Ensure the page remains usable during the transition.
* Avoid replaying the full entrance animation unnecessarily on every small state update.

## 4.2 Page Entrance Hierarchy

Animate important elements in a coordinated sequence.

Suggested order:

1. Main page background and shell.
2. Header or navigation.
3. Main title.
4. Primary content.
5. Supporting cards and secondary controls.

Use small stagger delays between elements.

Suggested timing:

| Element             | Delay |
| ------------------- | ----- |
| Main shell          | 0ms   |
| Header              | 40ms  |
| Page title          | 80ms  |
| Main content        | 120ms |
| Supporting elements | 160ms |

Avoid excessive stagger delays that make the page feel slow.

---

# 5. Navigation and Page Transitions

Navigation must feel smooth and consistent.

When users navigate between pages, avoid abrupt visual changes.

### Desired Behavior

* Fade out the previous page subtly.
* Introduce the next page with a gentle fade-in.
* Use small directional movement where appropriate.
* Preserve the shared application shell.
* Avoid unnecessary full-screen animations when only the main content changes.

### Suggested Transition

Outgoing content:

* Opacity from 1 to 0.
* Vertical movement of 4px to 8px.
* Duration of approximately 150ms.

Incoming content:

* Opacity from 0 to 1.
* Vertical movement of 8px to 12px.
* Duration of approximately 300ms.

The combined navigation should feel fluid and should not exceed roughly 500ms under normal conditions.

### React Router

If React Router is used, page transitions can be implemented using `AnimatePresence` and `motion` components from Framer Motion.

Use route-based animation keys carefully.

Do not remount the entire application shell unnecessarily.

### Navigation Rules

* Landing to login: subtle fade and upward entrance.
* Login to registration: smooth content transition within the authentication card.
* Login to chat: quick transition into the application shell.
* Chat to network information: preserve the shell and animate only the main content.
* Mobile user list to chat: use a subtle horizontal slide to communicate navigation hierarchy.

Browser back and forward navigation should work correctly.

---

# 6. Landing Page Animations

The landing page should introduce LANOVA with elegant, restrained motion.

## 6.1 Hero Entrance

Animate the hero content on initial page load.

Sequence:

1. Tagline fades in.
2. Main heading appears with a gentle upward motion.
3. Description fades in.
4. CTA enters with a subtle scale and fade.
5. Background lighting remains mostly static.

Suggested timing:

| Element      | Duration | Delay |
| ------------ | -------- | ----- |
| Tagline      | 350ms    | 50ms  |
| Main heading | 500ms    | 100ms |
| Description  | 400ms    | 180ms |
| CTA          | 350ms    | 250ms |

The overall effect should feel coordinated, not like a slow slideshow.

## 6.2 Highlighted Text

The lime-highlighted portion of the hero heading may use a subtle opacity transition.

Do not animate individual letters unless explicitly requested.

Avoid distracting text flickering, typewriter effects or excessive gradient movement.

## 6.3 CTA Hover

On hover:

* Move upward by 2px.
* Increase brightness slightly.
* Add a soft green glow.
* Transition smoothly.

```css
.hero-cta {
  transition:
    transform 200ms var(--ease-out),
    box-shadow 250ms var(--ease-standard),
    filter 200ms ease;
}

.hero-cta:hover {
  transform: translateY(-2px);

  filter: brightness(1.06);

  box-shadow:
    0 0 22px rgba(183, 245, 43, 0.25),
    0 0 55px rgba(183, 245, 43, 0.08);
}

.hero-cta:active {
  transform: scale(0.98);
}
```

## 6.4 Background Lighting

Ambient lighting may have an extremely slow, subtle movement if it improves the design.

If implemented:

* Keep movement almost imperceptible.
* Use a long animation cycle of approximately 12–20 seconds.
* Avoid continuously animating large, expensive blur filters.
* Prefer pre-rendered background artwork or static gradients when possible.

The background should never compete with the hero text.

---

# 7. Login and Registration Animations

Authentication pages should feel refined and responsive.

## 7.1 Authentication Card Entrance

When the authentication page opens:

* Fade in the logo.
* Fade and slide the authentication card upward slightly.
* Introduce the title and supporting text.
* Reveal the input fields with a subtle stagger.

Suggested behavior:

* Card: 400ms.
* Title: 350ms.
* Form fields: 250ms each with a 40ms stagger.
* Submit button: 300ms.

Keep the total entrance sequence compact.

## 7.2 Login and Registration Switching

When switching between login and registration:

* Animate the active tab indicator.
* Smoothly transition between form contents.
* Avoid a full-page reload.
* Avoid abrupt card height changes.

If the form heights differ, use a smooth height transition only when it does not create layout instability.

## 7.3 Input Focus

When an input receives focus:

* Transition the border to lime.
* Introduce a subtle focus glow.
* Keep the input position stable.
* Do not scale the entire form field.

Use a transition duration of approximately 180ms.

## 7.4 Password Visibility Toggle

When toggling password visibility:

* Switch the eye icon smoothly.
* Keep the input dimensions unchanged.
* Avoid unnecessary field remounting.
* Preserve the current input value and cursor position.

## 7.5 Form Submission

During submission:

* Disable repeated submission where appropriate.
* Replace the button label with a compact loading indicator.
* Maintain the button's dimensions.
* Display validation or authentication errors with a subtle fade and slide.

Do not use a full-screen loading animation for a normal login request.

---

# 8. Users and Chat List Animations

The user list should feel responsive and organized.

## 8.1 User List Entrance

When the user list first loads:

* Fade in the list container.
* Reveal the first few user rows with a subtle stagger if the list is short.
* Avoid animating hundreds of rows individually.
* Show a skeleton or loading placeholder while actual data is loading.

## 8.2 User Row Hover

On hover:

* Slightly brighten the background.
* Transition the border or selection indicator.
* Optionally move the row upward by 1px.
* Keep the avatar stable.

Avoid scaling entire rows, which can cause layout shifts.

## 8.3 Selected User

When selecting a user:

* Smoothly transition the background.
* Animate the selected indicator where appropriate.
* Introduce a subtle green border or accent.
* Avoid strong flashing or pulsing effects.

Selection should be immediately apparent.

## 8.4 Online and Offline Status

When a user's status changes:

* Fade the indicator between states.
* Transition the indicator color.
* Update the status label without shifting nearby content.

Online status may use a small green glow.

Do not continuously pulse every online indicator.

---

# 9. Chat Page Animations

The chat interface requires particularly careful motion design because users interact with it continuously.

Animations must not interfere with typing, reading or scrolling.

## 9.1 Chat Panel Entrance

When a conversation opens:

* Fade in the conversation header.
* Display the existing message history without excessive animation.
* Introduce the message composer smoothly.
* Avoid replaying all historical message entrance animations every time the user switches conversations.

The chat should become interactive immediately.

## 9.2 New Message Entrance

New messages should appear with a subtle animation.

```css
@keyframes message-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter {
  animation:
    message-enter 200ms
    var(--ease-out)
    both;
}
```

Rules:

* Animate only newly received or sent messages.
* Keep the vertical movement small.
* Avoid bouncing.
* Do not animate the entire message history on every render.
* Avoid layout changes that move messages unexpectedly.

## 9.3 Message Bubble

When a message is sent:

* Add the message to the interface promptly.
* Use a subtle entrance animation.
* Maintain clear distinction between sent and received messages.

Do not make message bubbles expand dramatically.

## 9.4 Typing Indicator

A typing indicator is optional and outside the initial MVP.

If added later:

* Use three small animated dots.
* Keep the animation subtle.
* Avoid continuous attention-grabbing effects.

## 9.5 Message Composer

On focus:

* Transition the border and glow.
* Keep the composer in a fixed position.

On send:

* Provide immediate button feedback.
* Use a brief pressed state.
* Clear the input only after the message has been accepted by the application's sending logic.

## 9.6 Auto-Scroll

When new messages arrive:

* Scroll to the bottom only when the user is already near the latest messages or has just sent a message.
* Use smooth scrolling for small, intentional movements.
* Do not forcibly scroll users who are reading older messages.
* Avoid animated scrolling during initial history loading if it causes visible jumps.

---

# 10. Network Information Page Animations

The network information dashboard should feel like a live technical interface without looking like an animated monitoring console.

## 10.1 Page Entrance

Use the standard page entrance.

Suggested sequence:

1. Page heading fades in.
2. Connection status appears.
3. Information cards enter with a small stagger.
4. Connection details panel appears.

Keep the entire entrance under approximately 500ms.

## 10.2 Information Cards

On hover:

* Slightly brighten the card.
* Introduce a subtle border transition.
* Add a small elevation effect.
* Keep the card dimensions unchanged.

Avoid strong glow on every card.

## 10.3 Status Changes

When the WebSocket connection changes:

* Smoothly transition the status indicator.
* Fade the accompanying text.
* Avoid blinking or flashing.

## 10.4 Active User Count

When the active user count changes:

* Update the number smoothly.
* Use a short opacity transition if appropriate.
* Avoid elaborate number-counting effects for small changes.

## 10.5 Copy Actions

When copying an IP address or port:

* Provide brief visual feedback.
* Change the copy icon to a check icon temporarily through component state.
* Display a short "Copied" label.
* Return to the default state smoothly.

Do not rely on animation alone to communicate success.

---

# 11. Loading Animations and Skeletons

Loading states should be informative and visually consistent.

Use loading indicators only when actual asynchronous operations are in progress.

## 11.1 General Loading Spinner

Use a small lime-accented spinner for short operations.

```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  width: 20px;
  height: 20px;

  border: 2px solid rgba(183, 245, 43, 0.18);
  border-top-color: #B7F52B;

  border-radius: 50%;

  animation: spin 800ms linear infinite;
}
```

Use spinners for:

* Form submission.
* Initial data requests when appropriate.
* Small asynchronous actions.

## 11.2 Skeleton Loading

Use skeleton placeholders for:

* User lists.
* Conversation history.
* Network information cards.

Skeleton appearance:

* Dark gray-green surface.
* Slightly lighter moving highlight.
* Rounded corners matching the final component.

Use a gentle shimmer only while loading.

Avoid using skeletons when data is already available.

## 11.3 Empty States

Empty states should appear immediately and use subtle entrance transitions.

Examples:

* No conversations yet.
* No users available.
* No messages in this conversation.
* No network connection.

Use small icons and short explanatory text.

Avoid unnecessary animated illustrations.

## 11.4 Full-Page Loading

Avoid full-screen loading screens for routine operations.

Use a full-page loader only when essential application initialization genuinely prevents the interface from rendering.

When possible, render the shared shell immediately and load individual content areas independently.

---

# 12. Modal and Overlay Animations

If dialogs or overlays are introduced:

Opening:

* Fade in the backdrop.
* Fade and scale the dialog from approximately 0.98 to 1.
* Use a short, smooth transition.

Closing:

* Fade out the dialog.
* Fade out the backdrop.
* Avoid delaying navigation while an overlay closes.

Suggested timing:

* Backdrop: 180ms.
* Dialog: 220ms.
* Closing: 150–200ms.

Keep the movement subtle.

Do not add unnecessary modals to the MVP.

---

# 13. Micro-Interactions

Micro-interactions provide feedback for small actions.

Use them for:

* Button clicks.
* Tab changes.
* Checkbox changes if present.
* Copy actions.
* Sidebar selection.
* Password visibility.
* Connection state updates.
* Message sending.
* Navigation links.

### Interaction Guidelines

| Interaction       | Animation                             |
| ----------------- | ------------------------------------- |
| Button hover      | Slight lift and brightness            |
| Button press      | Scale to 0.98                         |
| Input focus       | Border and glow transition            |
| Tab selection     | Sliding indicator                     |
| Sidebar selection | Smooth background transition          |
| Icon hover        | Subtle brightness or color change     |
| Copy action       | Icon swap and confirmation            |
| Status update     | Color and opacity transition          |
| New message       | Small fade and slide                  |
| Card hover        | Small elevation and border transition |

Every interaction should provide appropriate feedback.

Avoid adding an animation to every element simply because it is possible.

---

# 14. Background and Ambient Motion

LANOVA's visual identity includes glossy abstract side lighting and subtle green ambient effects.

Motion in these elements must remain restrained.

### Allowed Effects

* Extremely slow gradient movement.
* Subtle light-position changes.
* Very gentle ambient glow variation.

### Restrictions

* Do not use rapidly moving gradients.
* Do not continuously animate large blurred layers.
* Do not add floating particles across the whole interface.
* Do not introduce random motion behind text.
* Do not animate decorative elements in ways that affect readability.

If a generated background image is used, keep it static by default.

---

# 15. Responsive Motion Behavior

Animation behavior should adapt to device capabilities and screen sizes.

## Desktop

* Use subtle hover interactions.
* Apply standard page transitions.
* Support smooth sidebar and panel transitions.

## Tablet

* Keep page transitions.
* Reduce large movement distances.
* Avoid complicated layout animations when panels change size.

## Mobile

* Prioritize quick response.
* Use simple fade and slide transitions.
* Reduce large-scale motion.
* Avoid hover-only interactions.
* Ensure transitions do not interfere with touch interactions or the virtual keyboard.

On lower-powered devices, prefer opacity and transform animations.

---

# 16. Accessibility and Reduced Motion

Accessibility is mandatory.

Respect the user's system preference for reduced motion.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Additional requirements:

* Avoid flashing effects.
* Do not use motion as the only form of feedback.
* Preserve visible focus indicators.
* Keep controls usable while transitions are running.
* Avoid forced smooth scrolling.
* Ensure essential status changes remain visible without animation.

For users who prefer reduced motion, remove nonessential entrance movement and ambient effects while preserving the full functionality of the application.

---

# 17. Performance Guidelines

Animations must not affect the responsiveness of LANOVA.

### Prefer

* `transform`
* `opacity`
* Simple color transitions
* Short, controlled CSS keyframes

### Avoid Frequent Animation Of

* `width`
* `height`
* `top`
* `left`
* Large blur filters
* Expensive box shadows
* Complex layout properties

### Additional Rules

* Avoid unnecessary React re-renders during animation.
* Do not animate every message in a long conversation.
* Use stable keys for dynamically rendered lists.
* Avoid stacking multiple animations on the same element without a clear reason.
* Remove or clean up event listeners and animation-related resources where necessary.
* Do not use JavaScript animation loops for effects that CSS can handle efficiently.

---

# 18. Animation Component Guidelines

Keep repeated animation patterns reusable.

Suggested reusable components and utilities:

```text
src/
├── components/
│   ├── PageTransition.jsx
│   ├── FadeIn.jsx
│   ├── StaggerContainer.jsx
│   ├── LoadingSpinner.jsx
│   ├── Skeleton.jsx
│   └── AnimatedStatus.jsx
│
├── hooks/
│   └── useReducedMotion.js
│
└── styles/
    └── animations.css
```

Use reusable components only where they reduce duplication and improve consistency.

Do not create unnecessary animation abstractions for one-off effects.

Prefer straightforward CSS classes for simple transitions.

---

# 19. Strict Animation Constraints

The following rules must be followed.

1. Every main page must have a smooth, subtle entrance when first opened.
2. Page transitions must be consistent across the application.
3. Navigation must never feel abrupt or visually broken.
4. Hover and focus states must use smooth transitions.
5. Animations must not delay access to important controls.
6. New chat messages should appear smoothly.
7. Historical messages must not repeatedly animate on every render.
8. Loading animations must reflect genuine loading states.
9. Avoid unnecessary bouncing, shaking, flashing or spinning effects.
10. Do not animate large background effects excessively.
11. Do not introduce long transitions that make the application feel slow.
12. Do not sacrifice readability or usability for visual effects.
13. Respect reduced-motion preferences.
14. Keep animation timings consistent through shared tokens.
15. Ensure animations work correctly with React component mounting and unmounting.
16. Do not allow page transitions to interfere with browser navigation.
17. Avoid unnecessary layout shifts during animation.
18. Maintain responsive behavior across desktop, tablet and mobile.
19. Do not add animations to every element indiscriminately.
20. Keep the motion system aligned with the visual design defined in `design.md`.

---

# 20. Final Implementation Directive

Before implementing animations:

1. Read `design.md` and this document completely.
2. Identify all pages, components and interactions requiring motion.
3. Reuse the global motion tokens.
4. Implement the shared page entrance and navigation transition system first.
5. Apply consistent micro-interactions to buttons, inputs, cards and navigation.
6. Add page-specific effects only where they improve the experience.
7. Verify animations during actual navigation and real user interactions.
8. Test loading, empty, error, connected and disconnected states.
9. Verify that reduced-motion preferences are respected.
10. Check animation performance on both desktop and mobile.

### Motion Priority

1. Smooth page entrances.
2. Consistent navigation transitions.
3. Responsive interactive feedback.
4. Subtle chat message animations.
5. Loading and status transitions.
6. Refined decorative effects.

### Final Goal

LANOVA should feel fluid from the moment it opens until the user leaves it.

Every page should appear smoothly, every interaction should provide immediate and polished feedback, and every transition should feel natural.

**The objective is not to make LANOVA look animated. The objective is to make LANOVA feel effortlessly responsive.**
