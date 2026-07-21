export type ToastStatus = "info" | "success" | "warning" | "error";

export class ToastModel {
  id: string;
  title: string;
  description: string;
  status: ToastStatus;

  constructor({
    title,
    description,
    status = "info",
    id,
  }: {
    title: string;
    description: string;
    status?: ToastStatus;
    id?: string;
  }) {
    this.id = id ?? crypto.randomUUID();
    this.title = title;
    this.description = description;
    this.status = status;
  }
}
