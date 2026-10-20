"use client";

import styles from "./MultiOmics.module.css";

export const MULTI_OMICS_STEPS = [
  { id: 0, label: "Blob upload" },
  { id: 1, label: "RGCCA health" },
  { id: 2, label: "Feature extraction" },
  { id: 3, label: "Defined matrix" },
  { id: 4, label: "Extract weights" },
  { id: 5, label: "Apply weights" },
  { id: 6, label: "Final matrix" },
] as const;

export function WorkflowStepper({
  activeStep,
  unlockedThrough,
  onStepClick,
}: {
  activeStep: number;
  unlockedThrough: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <nav className={styles.verticalStepper} aria-label="Workflow progress">
      {MULTI_OMICS_STEPS.map((step, index) => {
        const locked = step.id > unlockedThrough;
        const active = step.id === activeStep;
        const complete = step.id < unlockedThrough;
        const isLast = index === MULTI_OMICS_STEPS.length - 1;

        return (
          <div key={step.id} className={styles.stepperItem}>
            <div className={styles.stepperNodeRow}>
              <button
                type="button"
                className={`${styles.stepperDot} ${complete ? styles.stepperDotComplete : ""} ${active ? styles.stepperDotActive : ""} ${locked ? styles.stepperDotLocked : ""}`}
                disabled={locked}
                onClick={() => !locked && onStepClick(step.id)}
                title={locked ? `${step.label} (locked)` : step.label}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${step.id + 1}: ${step.label}${complete ? " (complete)" : locked ? " (locked)" : ""}`}
              >
                <span className={styles.stepperDotInner} />
              </button>
              {!isLast ? (
                <div
                  className={`${styles.stepperLine} ${complete ? styles.stepperLineComplete : ""}`}
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <button
              type="button"
              className={`${styles.stepperLabel} ${active ? styles.stepperLabelActive : ""} ${locked ? styles.stepperLabelLocked : ""}`}
              disabled={locked}
              onClick={() => !locked && onStepClick(step.id)}
            >
              <span className={styles.stepperNumber}>Step {step.id + 1}</span>
              <span className={styles.stepperName}>{step.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
