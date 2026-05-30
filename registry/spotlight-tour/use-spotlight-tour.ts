import { useState, useCallback } from "react";

export interface TourStep {
  /** Matches the value of a `data-tour="..."` attribute on the target element. Omit for a centered modal step. */
  target?: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface UseSpotlightTourOptions {
  /** Unique key used to persist completion state in localStorage. */
  tourId: string;
  /** Custom localStorage key prefix. Defaults to "spotlight-tour". */
  storageKey?: string;
  /** If true, the tour will start even if previously completed. */
  alwaysShow?: boolean;
}

export function useSpotlightTour({
  tourId,
  storageKey = "spotlight-tour",
  alwaysShow = false,
}: UseSpotlightTourOptions) {
  const key = `${storageKey}-${tourId}`;

  const [hasCompleted, setHasCompleted] = useState(
    () => !alwaysShow && localStorage.getItem(key) === "true"
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const startTour = useCallback(() => {
    if (!hasCompleted || alwaysShow) {
      setCurrentStep(0);
      setIsActive(true);
    }
  }, [hasCompleted, alwaysShow]);

  const skipTour = useCallback(() => {
    localStorage.setItem(key, "true");
    setHasCompleted(true);
    setIsActive(false);
  }, [key]);

  const completeTour = useCallback(() => {
    localStorage.setItem(key, "true");
    setHasCompleted(true);
    setIsActive(false);
  }, [key]);

  const next = useCallback(
    () => setCurrentStep((s) => s + 1),
    []
  );

  const back = useCallback(
    () => setCurrentStep((s) => Math.max(0, s - 1)),
    []
  );

  const resetTour = useCallback(() => {
    localStorage.removeItem(key);
    setHasCompleted(false);
    setIsActive(false);
    setCurrentStep(0);
  }, [key]);

  return {
    hasCompleted,
    currentStep,
    isActive,
    startTour,
    skipTour,
    completeTour,
    next,
    back,
    resetTour,
  };
}
