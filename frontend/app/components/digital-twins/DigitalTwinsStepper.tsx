"use client";

import moi from "../multi-omics/MultiOmics.module.css";

export const DIGITAL_TWIN_STEPS = [
  { id: 0, label: "Extract features" },
  { id: 1, label: "DTDL model" },
  { id: 2, label: "Generate twins" },
  { id: 3, label: "Extract relationships" },
  { id: 4, label: "Generate relationships" },
  { id: 5, label: "Graph" },
] as const;

export function DigitalTwinsStepper({
  activeStep,
  unlockedThrough,
  onStepClick,
}: {
  activeStep: number;
  unlockedThrough: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <nav className={moi.verticalStepper} aria-label="Digital twin workflow">
      {DIGITAL_TWIN_STEPS.map((step, index) => {
        const locked = step.id > unlockedThrough;
        const active = step.id === activeStep;
        const complete = step.id < unlockedThrough;
        const isLast = index === DIGITAL_TWIN_STEPS.length - 1;

        return (
          <div key={step.id} className={moi.stepperItem}>
            <div className={moi.stepperNodeRow}>
              <button
                type="button"
                className={`${moi.stepperDot} ${complete ? moi.stepperDotComplete : ""} ${active ? moi.stepperDotActive : ""} ${locked ? moi.stepperDotLocked : ""}`}
                disabled={locked}
                onClick={() => !locked && onStepClick(step.id)}
                title={locked ? `${step.label} (locked)` : step.label}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${step.id + 1}: ${step.label}${complete ? " (complete)" : locked ? " (locked)" : ""}`}
              >
                <span className={moi.stepperDotInner} />
              </button>
              {!isLast ? (
                <div className={`${moi.stepperLine} ${complete ? moi.stepperLineComplete : ""}`} aria-hidden="true" />
              ) : null}
            </div>
            <button
              type="button"
              className={`${moi.stepperLabel} ${active ? moi.stepperLabelActive : ""} ${locked ? moi.stepperLabelLocked : ""}`}
              disabled={locked}
              onClick={() => !locked && onStepClick(step.id)}
            >
              <span className={moi.stepperNumber}>Step {step.id + 1}</span>
              <span className={moi.stepperName}>{step.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
