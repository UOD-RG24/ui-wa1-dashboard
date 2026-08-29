"use client";

import { ProgressBar, Step } from "react-step-progress-bar";
import "react-step-progress-bar/styles.css";
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
  const percent = (activeStep / (MULTI_OMICS_STEPS.length - 1)) * 100;

  return (
    <div className={styles.stepperWrap}>
      <ProgressBar percent={percent} height={4} filledBackground="#101d49" unfilledBackground="#dbe2ea">
        {MULTI_OMICS_STEPS.map((step) => {
          const locked = step.id > unlockedThrough;
          const active = step.id === activeStep;
          const done = step.id < activeStep;

          return (
            <Step key={step.id}>
              {() => (
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && onStepClick(step.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: active || done ? "50%" : 4,
                    border: "2px solid",
                    borderColor: locked ? "#dbe2ea" : "#101d49",
                    background: done ? "#101d49" : active ? "#365b8f" : "#e7edf4",
                    color: done || active ? "#fff" : "#64748b",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: locked ? "not-allowed" : "pointer",
                    marginTop: -12,
                  }}
                  title={locked ? `${step.label} (locked)` : step.label}
                >
                  {step.id + 1}
                </button>
              )}
            </Step>
          );
        })}
      </ProgressBar>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#64748b" }}>
        {MULTI_OMICS_STEPS.map((s) => (
          <span key={s.id} style={{ maxWidth: 72, textAlign: "center" }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
