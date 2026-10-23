import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import menuConfig from "../config/menuConfig";
import Layout from "../pages/layout/Layout";

import RedirectHandler from "./RedirectHandler";
import LoginPage from "../pages/auth/LoginPage";

// Helper function to thoroughly validate a user session structure
const isValidUserSession = () => {
  const userRaw = sessionStorage.getItem("user");
  if (!userRaw) return false;

  try {
    const userData = JSON.parse(userRaw);
    // Ensure the parsed JSON object contains your structural employee metrics
    return (
      userData && typeof userData === "object" && userData.emp_Id !== undefined
    );
  } catch (e) {
    // If JSON parsing fails (e.g. string is manual text garbage), clear it out
    sessionStorage.removeItem("user");
    return false;
  }
};

const ProtectedRoute = ({ children }) => {
  return isValidUserSession() ? (
    children
  ) : (
    <Navigate to="/daedalus-login" replace />
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/daedalus-login"
          element={
            <Suspense fallback={<div>{<RedirectHandler />}</div>}>
              <LoginPage />
            </Suspense>
          }
        />

        {/* 🔒 Protected Routes (auth required) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {menuConfig.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Suspense fallback={<div>{<RedirectHandler />}</div>}>
                  <Component />
                </Suspense>
              }
            />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/daedalus-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
