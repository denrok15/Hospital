import { Routes, Route, Navigate } from "react-router-dom";
import {
  AuthPage,
  ConsultationPage,
  CreateInspectionPage,
  DetailInspectionPage,
  PatientCardPage,
  PatientPage,
  ProfilePage,
  RegistrationPage,
  ReportsPage,
} from "app/pages";
import { ProtectedRouter } from "./ProtectedRouter";

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRouter>
            <ProfilePage />
          </ProtectedRouter>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRouter>
            <PatientPage />
          </ProtectedRouter>
        }
      />
      <Route
        path="/patient/:id"
        element={
          <ProtectedRouter>
            <PatientCardPage />
          </ProtectedRouter>
        }
      />
      <Route
        path="/inspection/create"
        element={
          <ProtectedRouter>
            <CreateInspectionPage />
          </ProtectedRouter>
        }
      />
      <Route
        path="/inspection/:id"
        element={
          <ProtectedRouter>
            <DetailInspectionPage />
          </ProtectedRouter>
        }
      />
      <Route path="/consultation" element={<Navigate to="/consultations" replace />} />
      <Route
        path="/consultations"
        element={
          <ProtectedRouter>
            <ConsultationPage />
          </ProtectedRouter>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRouter>
            <ReportsPage />
          </ProtectedRouter>
        }
      />
    </Routes>
  );
};
