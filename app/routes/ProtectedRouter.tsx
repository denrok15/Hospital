import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "app/hooks";

export const ProtectedRouter = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("accessToken");
  const { data, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-500">
        Загрузка...
      </div>
    );
  }

  if (!token || !data) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
