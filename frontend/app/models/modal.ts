export type ModalKind = "information" | "confirm" | "input";

export class InfoModalModel {
  kind: "information" = "information";
  title: string;
  description: string;
  onOk?: () => void;

  constructor({ title, description, onOk }: { title: string; description: string; onOk?: () => void }) {
    this.title = title;
    this.description = description;
    this.onOk = onOk;
  }
}

export class ConfirmModalModel {
  kind: "confirm" = "confirm";
  title: string;
  description: string;
  onYes?: () => void;
  onNo?: () => void;

  constructor({
    title,
    description,
    onYes,
    onNo,
  }: {
    title: string;
    description: string;
    onYes?: () => void;
    onNo?: () => void;
  }) {
    this.title = title;
    this.description = description;
    this.onYes = onYes;
    this.onNo = onNo;
  }
}

export class InputModalModel {
  kind: "input" = "input";
  title: string;
  description: string;
  label: string;
  defaultValue?: string;
  onOk?: (value: string) => void;
  onCancel?: () => void;

  constructor({
    title,
    description,
    label,
    defaultValue = "",
    onOk,
    onCancel,
  }: {
    title: string;
    description: string;
    label: string;
    defaultValue?: string;
    onOk?: (value: string) => void;
    onCancel?: () => void;
  }) {
    this.title = title;
    this.description = description;
    this.label = label;
    this.defaultValue = defaultValue;
    this.onOk = onOk;
    this.onCancel = onCancel;
  }
}

export type ModalModel = InfoModalModel | ConfirmModalModel | InputModalModel;
