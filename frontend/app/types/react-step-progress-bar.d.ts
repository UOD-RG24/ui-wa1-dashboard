declare module "react-step-progress-bar" {
  import type { ReactNode } from "react";

  export interface ProgressBarProps {
    percent: number;
    height?: number;
    filledBackground?: string;
    unfilledBackground?: string;
    children?: ReactNode;
  }

  export function ProgressBar(props: ProgressBarProps): JSX.Element;

  export interface StepProps {
    children: (props: { accomplished: boolean; index: number }) => ReactNode;
  }

  export function Step(props: StepProps): JSX.Element;
}

declare module "react-step-progress-bar/styles.css";
