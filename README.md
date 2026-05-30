# shadcn-spotlight-tour

A plug-and-play **spotlight onboarding tour** component for [shadcn/ui](https://ui.shadcn.com) projects.

Highlights UI elements with a spotlight ring, shows a positioned tooltip, and persists completion state to `localStorage` — no external dependencies beyond `lucide-react` and shadcn's `Button`.

---

## Installation

```bash
npx shadcn add https://raw.githubusercontent.com/iamsatar/shadcn-spotlight-tour/main/registry.json/spotlight-tour
```

This copies two files into your project:
- `components/spotlight-tour.tsx` — the component
- `hooks/use-spotlight-tour.ts` — the state hook

---

## Usage

### 1. Add `data-tour` attributes to elements you want to highlight

```tsx
<nav data-tour="sidebar">...</nav>
<div data-tour="dashboard-metrics">...</div>
```

### 2. Define your steps

```tsx
import type { TourStep } from "@/hooks/use-spotlight-tour";

const STEPS: TourStep[] = [
  {
    title: "Welcome!",
    description: "Let's take a quick tour. This will only take a minute.",
    // No `target` = centered modal step
  },
  {
    target: "sidebar",
    title: "Navigation",
    description: "Use the sidebar to move between sections.",
  },
  {
    target: "dashboard-metrics",
    title: "Key Metrics",
    description: "Your most important numbers at a glance.",
  },
];
```

### 3. Wire up the hook and component

```tsx
import { SpotlightTour } from "@/components/spotlight-tour";
import { useSpotlightTour } from "@/hooks/use-spotlight-tour";

export function Dashboard() {
  const tour = useSpotlightTour({ tourId: "dashboard" });

  // Auto-start on first visit
  useEffect(() => {
    const t = setTimeout(() => tour.startTour(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* your page content */}

      <SpotlightTour
        steps={STEPS}
        currentStep={tour.currentStep}
        isActive={tour.isActive}
        onNext={tour.next}
        onBack={tour.back}
        onSkip={tour.skipTour}
        onComplete={tour.completeTour}
      />
    </>
  );
}
```

### 4. Re-trigger the tour (e.g. from a Help button)

```tsx
<Button onClick={tour.resetTour}>Restart Tour</Button>
```

---

## API

### `useSpotlightTour(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `tourId` | `string` | required | Unique key per tour, used for localStorage |
| `storageKey` | `string` | `"spotlight-tour"` | localStorage key prefix |
| `alwaysShow` | `boolean` | `false` | Show tour even if already completed |

Returns: `{ hasCompleted, currentStep, isActive, startTour, skipTour, completeTour, next, back, resetTour }`

### `<SpotlightTour />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `steps` | `TourStep[]` | required | Array of tour steps |
| `currentStep` | `number` | required | Current step index |
| `isActive` | `boolean` | required | Whether the tour is visible |
| `onNext` | `() => void` | required | Called on Next button |
| `onBack` | `() => void` | required | Called on Back button |
| `onSkip` | `() => void` | required | Called on Skip/backdrop click |
| `onComplete` | `() => void` | required | Called when Done is clicked on last step |
| `tooltipWidth` | `number` | `320` | Tooltip card width in px |
| `highlightPadding` | `number` | `4` | Padding around spotlight ring in px |

### `TourStep`

| Field | Type | Description |
|---|---|---|
| `target` | `string?` | Value of `data-tour` attribute on element. Omit for a centered step. |
| `title` | `string` | Step heading |
| `description` | `string` | Step body text |
| `position` | `"top" \| "bottom" \| "left" \| "right"` | Preferred tooltip side (auto-calculated if omitted) |

---

## How it works

1. **Targeting** — Steps reference DOM elements via `data-tour="value"` attributes.
2. **Spotlight** — A full-screen backdrop is rendered at `z-index: 10000`. The target element's `z-index` is temporarily boosted to `10002` to visually "cut through" the backdrop.
3. **Highlight ring** — A positioned `div` with `ring-4 ring-primary/70` is placed over the target using `getBoundingClientRect()`.
4. **Smart positioning** — The tooltip is placed below the target by default, falling back to above, or to the right for tall elements (e.g. sidebars). All positions are clamped to the viewport.
5. **Resize/scroll handling** — `ResizeObserver` + scroll listeners re-measure the target on layout changes.
6. **Persistence** — Completion is stored in `localStorage` so the tour only shows once per `tourId`.

---

## Requirements

- React 18+
- Tailwind CSS v3 or v4
- [shadcn/ui](https://ui.shadcn.com) with the `Button` component installed
- `lucide-react`
