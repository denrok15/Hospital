import { createContext, useContext } from "react";

export type ToastType = "success" | "error";

export type ToasterContextValue = {
  showToast: (text: string, type?: ToastType) => void;
};

export const ToasterContext = createContext<ToasterContextValue | null>(null);

export const useToaster = () => {
  const context = useContext(ToasterContext);
  if (!context) {
    throw new Error("useToaster must be used within ToasterProvider");
  }

  return context;
};
