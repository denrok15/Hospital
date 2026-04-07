import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ToasterContext, type ToastType } from "./toaster-context";

type ToastItem = { id: number; text: string; type: ToastType };

const TOAST_LIFETIME_MS = 3500;

const ToastList = ({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: number) => void;
}) => {
  return (
    <div className="fixed right-4 bottom-4 z-[1000] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm shadow-md ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="m-0 flex-1">{toast.text}</p>
            <button
              type="button"
              className="text-current/70 hover:text-current transition-colors cursor-pointer"
              onClick={() => onClose(toast.id)}
              aria-label="Закрыть уведомление"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ToasterProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<number, number>>(new Map());

  const removeToast = useCallback((id: number) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((text: string, type: ToastType = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, text, type }]);

    const timeoutId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      timeoutsRef.current.delete(id);
    }, TOAST_LIFETIME_MS);

    timeoutsRef.current.set(id, timeoutId);
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <ToastList toasts={toasts} onClose={removeToast} />
    </ToasterContext.Provider>
  );
};
