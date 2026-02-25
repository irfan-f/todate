# PR: feature/resizable-timeline-panel — Prepare for review

## Summary

Improvements to the Create Todate form, timeline panel, and related components: responsive layout, overflow handling, select styling, timeline scroll/pan, and year input UX.

## Changes

### Form & layout
- **TodateForm**: Container queries (`@container`, `@md:flex-row`) so layout stacks on narrow containers and switches to two-column at ~448px
- **App.tsx**: Form wrapper gets `@container min-w-0 overflow-x-hidden` for container queries and to prevent horizontal scrollbar flicker
- **TodateForm**: Tags column responsive — full width when stacked, `w-44` when side-by-side
- **TodateForm**: Date fields and blocks use `min-w-0 overflow-hidden` to avoid truncation
- **TodateForm**: Compact date inputs unified (`compactInputClass`, `compactSelectClass`), month select no longer wider than year/day

### Overflow & scroll
- **Modal, TodateLine, TodateForm, TodateLine right content**: `overflow-x-hidden`, `min-w-0` where needed to prevent horizontal scrollbar flicker during resize

### Timeline
- **TimelineBar**: Scroll-to-pan (plain wheel, no modifier) with higher sensitivity; pinch-to-zoom still uses ctrl/cmd+wheel
- **TimelineBar**: Single-finger touch pan for vertical panning
- **TimelineFilters**: Year inputs use local state + commit on blur/Enter; `type="text"` with `inputMode="numeric"` for better keyboard UX

### Select styling
- **index.css**: Base select styles (appearance, padding, chevron) to match text inputs
- **TodateForm, SchoolDataForm**: Selects use `pl-2 pr-7` / `pl-3 pr-7` for chevron space

## Build

- `npm run build` — passes

## Lint

- Some existing lint issues on this branch (App.tsx, TimelineBar, TimelineFilters, TodateLine, sampleData) — not introduced by this PR

## Testing

- Manual testing recommended: form layout at different widths, timeline scroll/pan, year input blur/Enter, select chevrons
