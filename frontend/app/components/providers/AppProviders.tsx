"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ModalModel } from "../../models/modal";
import { ToastModel } from "../../models/toast";
import { ModalComponent } from "../ui/Modal";
import { ToastStack } from "../ui/Toast";

type AppContextValue = {
  showToast: (model: ToastModel) => void;
  showModal: (model: ModalModel) => void;
  closeModal: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastModel[]>([]);
  const [modal, setModal] = useState<ModalModel | null>(null);

  const showToast = useCallback((model: ToastModel) => {
    setToasts((current) => [...current, model]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== model.id));
    }, 5000);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showModal = useCallback((model: ModalModel) => {
    setModal(model);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      showModal,
      closeModal,
    }),
    [showToast, showModal, closeModal],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onClose={closeToast} />
      {modal ? <ModalComponent modal={modal} onClose={closeModal} /> : null}
    </AppContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppShell must be used within AppProviders");
  }
  return context;
}
