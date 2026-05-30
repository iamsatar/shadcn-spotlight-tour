import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpotlightTour } from "../registry/spotlight-tour/use-spotlight-tour";

const OPTIONS = { tourId: "test" };

describe("useSpotlightTour", () => {
  // ─── initial state ───────────────────────────────────────────────────────

  it("starts inactive and on step 0", () => {
    const { result } = renderHook(() => useSpotlightTour(OPTIONS));
    expect(result.current.isActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.hasCompleted).toBe(false);
  });

  it("reads hasCompleted from localStorage on mount", () => {
    localStorage.setItem("spotlight-tour-test", "true");
    const { result } = renderHook(() => useSpotlightTour(OPTIONS));
    expect(result.current.hasCompleted).toBe(true);
  });

  // ─── startTour ───────────────────────────────────────────────────────────

  it("startTour activates the tour when not completed", () => {
    const { result } = renderHook(() => useSpotlightTour(OPTIONS));
    act(() => result.current.startTour());
    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it("startTour does NOT activate when already completed", () => {
    localStorage.setItem("spotlight-tour-test", "true");
    const { result } = renderHook(() => useSpotlightTour(OPTIONS));
    act(() => result.current.startTour());
    expect(result.current.isActive).toBe(false);
  });

  it("startTour activates when alwaysShow is true even if completed", () => {
    localStorage.setItem("spotlight-tour-test", "true");
    const { result } = renderHook(() =>
      useSpotlightTour({ tourId: "test", alwaysShow: true })
    );
    act(() => result.current.startTour());
    expect(result.current.isActive).toBe(true);
  });

  // ─── navigation ──────────────────────────────────────────────────────────

  it("next increments the step", () => {
    const { result } = renderHook(() => useSpotlightTour(OPTIONS));
    act(() => result.current.startTour());
    act(() => result.current.next());
    expect(result.current.currentStep).toBe(1);
  });

  it("back decrements the step but never below 0", () => {
    const { result } = renderHook(() => useSpotlightTour(OPTIONS));
    act(() => result.current.startTour());
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.back());
    expect(result.current.currentStep).toBe(1);
    act(() => result.current.back());
    act(() => result.current.back()); // extra back — should clamp at 0
    expect(result.current.currentStep).toBe(0);
  });

  // ─── skipTour ────────────────────────────────────────────────────────────

  it("skipTour deactivates the tour, marks completed, persists to localStorage", () => {
    const { result } = renderHook(() => useSpotlightTour(OPTIONS));
    act(() => result.current.startTour());
    act(() => result.current.skipTour());
    expect(result.current.isActive).toBe(false);
    expect(result.current.hasCompleted).toBe(true);
    expect(localStorage.getItem("spotlight-tour-test")).toBe("true");
  });

  // ─── completeTour ─────────────────────────────────────────────────────────

  it("completeTour deactivates the tour, marks completed, persists to localStorage", () => {
    const { result } = renderHook(() => useSpotlightTour(OPTIONS));
    act(() => result.current.startTour());
    act(() => result.current.completeTour());
    expect(result.current.isActive).toBe(false);
    expect(result.current.hasCompleted).toBe(true);
    expect(localStorage.getItem("spotlight-tour-test")).toBe("true");
  });

  // ─── resetTour ───────────────────────────────────────────────────────────

  it("resetTour clears localStorage, resets all state", () => {
    const { result } = renderHook(() => useSpotlightTour(OPTIONS));
    act(() => result.current.startTour());
    act(() => result.current.completeTour());
    act(() => result.current.resetTour());
    expect(result.current.hasCompleted).toBe(false);
    expect(result.current.isActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(localStorage.getItem("spotlight-tour-test")).toBeNull();
  });

  // ─── custom storageKey ───────────────────────────────────────────────────

  it("respects a custom storageKey prefix", () => {
    const { result } = renderHook(() =>
      useSpotlightTour({ tourId: "test", storageKey: "my-app" })
    );
    act(() => result.current.completeTour());
    expect(localStorage.getItem("my-app-test")).toBe("true");
    // Default key must NOT be set
    expect(localStorage.getItem("spotlight-tour-test")).toBeNull();
  });
});
