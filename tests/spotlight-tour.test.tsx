import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SpotlightTour } from "../registry/spotlight-tour/spotlight-tour";
import type { TourStep } from "../registry/spotlight-tour/use-spotlight-tour";

// ─── fixtures ────────────────────────────────────────────────────────────────

const STEPS: TourStep[] = [
  { title: "Step 1", description: "First step, no target" },
  { title: "Step 2", description: "Second step", target: "my-element" },
  { title: "Step 3", description: "Last step" },
];

const noop = () => {};

function defaultProps(overrides = {}) {
  return {
    steps: STEPS,
    currentStep: 0,
    isActive: true,
    onNext: noop,
    onBack: noop,
    onSkip: noop,
    onComplete: noop,
    ...overrides,
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Inject a real DOM element that can be targeted by data-tour */
function injectTarget(value: string) {
  const el = document.createElement("div");
  el.setAttribute("data-tour", value);
  el.style.width = "200px";
  el.style.height = "50px";
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  // Clean up injected elements
  document.querySelectorAll("[data-tour]").forEach((el) => el.remove());
});

// ─── rendering ───────────────────────────────────────────────────────────────

describe("SpotlightTour rendering", () => {
  it("renders nothing when isActive is false", () => {
    const { container } = render(
      <SpotlightTour {...defaultProps({ isActive: false })} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the backdrop when active", () => {
    render(<SpotlightTour {...defaultProps()} />);
    expect(document.querySelector(".fixed.inset-0")).toBeInTheDocument();
  });

  it("renders the tooltip dialog when active", () => {
    render(<SpotlightTour {...defaultProps()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("displays the current step title and description", () => {
    render(<SpotlightTour {...defaultProps()} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("First step, no target")).toBeInTheDocument();
  });

  it("sets aria-label on dialog to the step title", () => {
    render(<SpotlightTour {...defaultProps()} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Step 1");
  });

  it("renders progress dots equal to step count", () => {
    render(<SpotlightTour {...defaultProps()} />);
    const progress = screen.getByLabelText("Tour progress");
    expect(progress.children).toHaveLength(STEPS.length);
  });
});

// ─── navigation buttons ───────────────────────────────────────────────────────

describe("SpotlightTour navigation", () => {
  it("does NOT show Back button on the first step", () => {
    render(<SpotlightTour {...defaultProps({ currentStep: 0 })} />);
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
  });

  it("shows Back button on steps after the first", () => {
    render(<SpotlightTour {...defaultProps({ currentStep: 1 })} />);
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("shows Next on non-last steps and Done on the last step", () => {
    const { rerender } = render(
      <SpotlightTour {...defaultProps({ currentStep: 0 })} />
    );
    expect(screen.getByText("Next")).toBeInTheDocument();

    rerender(
      <SpotlightTour
        {...defaultProps({ currentStep: STEPS.length - 1 })}
      />
    );
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("calls onNext when Next is clicked on a non-last step", () => {
    const onNext = vi.fn();
    render(<SpotlightTour {...defaultProps({ currentStep: 0, onNext })} />);
    fireEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("calls onComplete when Done is clicked on the last step", () => {
    const onComplete = vi.fn();
    render(
      <SpotlightTour
        {...defaultProps({
          currentStep: STEPS.length - 1,
          onComplete,
        })}
      />
    );
    fireEvent.click(screen.getByText("Done"));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("calls onBack when Back is clicked", () => {
    const onBack = vi.fn();
    render(
      <SpotlightTour {...defaultProps({ currentStep: 1, onBack })} />
    );
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

// ─── skip / dismiss ───────────────────────────────────────────────────────────

describe("SpotlightTour skip", () => {
  it("calls onSkip when the X button is clicked", () => {
    const onSkip = vi.fn();
    render(<SpotlightTour {...defaultProps({ onSkip })} />);
    fireEvent.click(screen.getByLabelText("Skip tour"));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("calls onSkip when the backdrop is clicked", () => {
    const onSkip = vi.fn();
    render(<SpotlightTour {...defaultProps({ onSkip })} />);
    const backdrop = document.querySelector(".fixed.inset-0") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("does NOT call onSkip when the tooltip itself is clicked", () => {
    const onSkip = vi.fn();
    render(<SpotlightTour {...defaultProps({ onSkip })} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onSkip).not.toHaveBeenCalled();
  });
});

// ─── spotlight targeting ──────────────────────────────────────────────────────

describe("SpotlightTour spotlight", () => {
  it("does NOT render highlight ring on a step with no target", () => {
    render(<SpotlightTour {...defaultProps({ currentStep: 0 })} />);
    // Highlight ring has pointer-events-none; backdrop does not
    const rings = document.querySelectorAll(".pointer-events-none");
    expect(rings).toHaveLength(0);
  });

  it("boosts z-index of a targeted element above the backdrop", () => {
    const el = injectTarget("my-element");
    render(<SpotlightTour {...defaultProps({ currentStep: 1 })} />);
    expect(el.style.zIndex).toBe("10002");
  });

  it("restores z-index of targeted element after tour becomes inactive", () => {
    const el = injectTarget("my-element");
    el.style.zIndex = "5";
    const { rerender } = render(
      <SpotlightTour {...defaultProps({ currentStep: 1 })} />
    );
    rerender(
      <SpotlightTour {...defaultProps({ currentStep: 1, isActive: false })} />
    );
    expect(el.style.zIndex).toBe("5");
  });
});

// ─── props ────────────────────────────────────────────────────────────────────

describe("SpotlightTour props", () => {
  it("applies custom tooltipWidth to the tooltip style", () => {
    render(<SpotlightTour {...defaultProps({ tooltipWidth: 400 })} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveStyle({ width: "400px" });
  });
});
