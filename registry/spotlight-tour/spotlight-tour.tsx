"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourStep } from "./use-spotlight-tour";

type Position = { top: number; left: number; width: number; height: number };

interface SpotlightTourProps {
  steps: TourStep[];
  currentStep: number;
  isActive: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
  /** Width of the tooltip card in px. Defaults to 320. */
  tooltipWidth?: number;
  /** Extra padding around the spotlight highlight ring in px. Defaults to 4. */
  highlightPadding?: number;
}

export function SpotlightTour({
  steps,
  currentStep,
  isActive,
  onNext,
  onBack,
  onSkip,
  onComplete,
  tooltipWidth = 320,
  highlightPadding = 4,
}: SpotlightTourProps) {
  const [pos, setPos] = useState<Position | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const hasTarget = !!step?.target;

  const measureTarget = useCallback(() => {
    if (!isActive || !step?.target) {
      setPos(null);
      return;
    }
    const el = document.querySelector(
      `[data-tour="${step.target}"]`
    ) as HTMLElement | null;
    if (!el) {
      setPos(null);
      return;
    }
    // Scroll target into view before measuring
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [isActive, step]);

  // Measure on step change
  useEffect(() => {
    measureTarget();
  }, [measureTarget]);

  // Re-measure on resize / scroll
  useEffect(() => {
    if (!isActive) return;
    const handler = () => measureTarget();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [isActive, measureTarget]);

  // Boost z-index of highlighted element above the backdrop
  useEffect(() => {
    if (!isActive || !step?.target) return;
    const el = document.querySelector(
      `[data-tour="${step.target}"]`
    ) as HTMLElement | null;
    if (!el) return;
    const prevPosition = el.style.position;
    const prevZ = el.style.zIndex;
    el.style.position = el.style.position || "relative";
    el.style.zIndex = "10002";
    return () => {
      el.style.position = prevPosition;
      el.style.zIndex = prevZ;
    };
  }, [isActive, step, currentStep]);

  if (!isActive || !step) return null;

  const handleNext = () => {
    if (isLast) onComplete();
    else onNext();
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!hasTarget || !pos) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10003,
      };
    }
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const tooltipH = 200;
    const gap = 12;
    const padding = 16;

    // Tall element (e.g. sidebar): place to the right
    if (pos.height > vh * 0.5) {
      return {
        position: "fixed",
        top: Math.min(pos.top + 60, vh - tooltipH - padding),
        left: pos.left + pos.width + gap,
        zIndex: 10003,
      };
    }

    // Prefer below; fall back to above if not enough room
    const spaceBelow = vh - (pos.top + pos.height);
    const top =
      spaceBelow >= tooltipH + gap
        ? pos.top + pos.height + gap
        : pos.top - tooltipH - gap;

    return {
      position: "fixed",
      top: Math.max(padding, Math.min(top, vh - tooltipH - padding)),
      left: Math.max(
        padding,
        Math.min(pos.left, vw - tooltipWidth - padding)
      ),
      zIndex: 10003,
    };
  };

  const hp = highlightPadding;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10000] bg-black/50"
        aria-hidden="true"
        onClick={onSkip}
      />

      {/* Highlight ring */}
      {hasTarget && pos && (
        <div
          className="fixed z-[10001] rounded-lg ring-4 ring-primary/70 pointer-events-none transition-all duration-200"
          style={{
            top: pos.top - hp,
            left: pos.left - hp,
            width: pos.width + hp * 2,
            height: pos.height + hp * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="rounded-lg border border-border bg-card p-4 shadow-xl"
        style={{ ...getTooltipStyle(), width: tooltipWidth, position: "fixed" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground leading-snug pr-2">
            {step.title}
          </h3>
          <button
            type="button"
            onClick={onSkip}
            aria-label="Skip tour"
            className="text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center rounded-md -mt-1 -mr-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

        {/* Footer: dots + nav */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" aria-label="Tour progress">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === currentStep
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {!isFirst && (
              <Button size="sm" variant="ghost" onClick={onBack}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
