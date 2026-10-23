import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "../../config/authConfig";
import Daedalus from "../../assets/logo/Daedalus-Logo.png";
import SwiftLogo from "../../assets/logo/IndefLogo.png";
import ScissorLift from "../../assets/images/scissor-lift.jpeg";
import WarehouseBg from "../../assets/images/warehouse-bg.jpg";
import { API_BASE_URL, AUTH_TOKEN } from "../../config/env";

// Replace these with Daedalus-specific endpoints once the backend is ready.
const AUTH_ENDPOINTS = {
  microsoft: "/ILeap/MicrosoftAuthenticate",
  credentials: "/ILeap/AuthenticateHDUser",
};
const DASHBOARD_ROUTE = "/iReact/daedalus-item-master";
const ACCENT = "#2563eb";
const ERROR = "#dc2626";

const msalInstance = new PublicClientApplication({
  ...msalConfig,
  cache: {
    ...msalConfig.cache,
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
});
const msalReady = msalInstance.initialize();

async function postAuth(endpoint, payload) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: AUTH_TOKEN },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.status !== "Success" || !data?.data) {
    throw new Error(
      data?.message || `Authentication failed (${response.status})`,
    );
  }
  return data.data;
}

function MicrosoftMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

export default function DaedalusLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("choose");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const finishLogin = (user) => {
    sessionStorage.setItem("user", JSON.stringify(user));
    navigate(DASHBOARD_ROUTE, { replace: true });
  };

  const authenticateMicrosoft = async (result) => {
    const email = result?.account?.username;
    if (!email) throw new Error("Microsoft did not return an email address.");
    if (/@(gmail|outlook|hotmail)\.com$/i.test(email)) {
      throw new Error("Please use your corporate Microsoft account.");
    }
    setStatus("Verifying your Daedalus access...");
    const user = await postAuth(AUTH_ENDPOINTS.microsoft, {
      email,
      idToken: result.idToken,
    });
    finishLogin(user);
  };

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      setLoading(true);
      setStatus("Checking your session...");
      try {
        await msalReady;
        const redirect = await msalInstance.handleRedirectPromise();
        if (!active) return;
        if (redirect) {
          await authenticateMicrosoft(redirect);
          return;
        }
        if (sessionStorage.getItem("explicit_logout") === "true") {
          sessionStorage.removeItem("explicit_logout");
          return;
        }
        const accounts = msalInstance.getAllAccounts();
        const account = accounts.find((a) =>
          a.username?.toLowerCase().endsWith("@indef.com"),
        );
        if (account) {
          setStatus("Restoring Microsoft session...");
          let token;
          try {
            token = await msalInstance.acquireTokenSilent({
              ...loginRequest,
              account,
            });
          } catch (silentError) {
            console.warn("Silent Microsoft login failed:", silentError);
            if (active) {
              setStatus("Redirecting to Microsoft secure sign-in...");
              await msalInstance.loginRedirect({
                ...loginRequest,
                domainHint: "indef.com",
              });
            }
            return;
          }
          if (active) await authenticateMicrosoft(token);
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to verify your session.");
      } finally {
        if (active) setLoading(false);
      }
    };
    initialize();
    return () => {
      active = false;
    };
  }, []);

  const handleMicrosoftLogin = async () => {
    setError("");
    setLoading(true);
    setStatus("Opening Microsoft sign-in...");
    try {
      await msalReady;
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      setError(err.message || "Microsoft sign-in could not start.");
      setLoading(false);
    }
  };

  const handleCredentialLogin = async (event) => {
    event.preventDefault();
    setError("");
    const nextErrors = {};
    if (!username.trim()) nextErrors.username = "Employee number is required.";
    if (!password.trim()) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    setStatus("Signing you in...");
    try {
      const user = await postAuth(AUTH_ENDPOINTS.credentials, {
        emp_No: username.trim(),
        password,
      });
      finishLogin(user);
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="daedalus-login">
      <div className="daedalus-shell">
        <section className="daedalus-hero">
          <div className="hero-top">
            <img
              className="company-logo hero-daedalus-logo"
              src={Daedalus}
              alt="Daedalus logo"
            />
          </div>

          <div className="hero-content">
            <span className="hero-kicker">ORDER INTAKE MANAGEMENT</span>
            <h1>DAEDALUS</h1>
          </div>
        </section>

        <section className="daedalus-form-panel">
          <div className="form-inner">
            <div className="flex justify-center mb-4">
              <img className="company-logo" src={SwiftLogo} alt="Indef logo" />
            </div>
            <div className="mobile-brand">DAEDALUS · ORDER INTAKE</div>
            <span className="form-eyebrow">SECURE EMPLOYEE ACCESS</span>
            <h2>Welcome back</h2>
            <p className="form-subtitle">Sign in to your Daedalus workspace.</p>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            {loading ? (
              <div className="auth-loading" role="status">
                <span className="spinner" />
                {status}
              </div>
            ) : mode === "choose" ? (
              <div className="auth-actions">
                <button
                  type="button"
                  className="microsoft-button"
                  onClick={handleMicrosoftLogin}
                >
                  <MicrosoftMark /> Continue with Microsoft
                </button>
                <div className="auth-divider">
                  <span>or sign in with credentials</span>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setMode("credentials");
                    setError("");
                  }}
                >
                  Use employee credentials <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleCredentialLogin}
                noValidate
                className="text-left"
              >
                <label htmlFor="daedalus-username">Employee number</label>
                <input
                  id="daedalus-username"
                  value={username}
                  autoComplete="username"
                  placeholder="Enter your employee number"
                  aria-invalid={!!errors.username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrors((p) => ({ ...p, username: "" }));
                  }}
                />
                {errors.username && (
                  <small className="field-error">{errors.username}</small>
                )}
                <label htmlFor="daedalus-password">Password</label>
                <div className="password-wrap">
                  <input
                    id="daedalus-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: "" }));
                    }}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <small className="field-error">{errors.password}</small>
                )}
                <button className="primary-button login-submit" type="submit">
                  Sign in <span aria-hidden="true">→</span>
                </button>
                <button
                  className="back-button"
                  type="button"
                  onClick={() => {
                    setMode("choose");
                    setError("");
                    setErrors({});
                  }}
                >
                  ← Back to sign-in options
                </button>
              </form>
            )}
            <div className="secure-note">
              <span>●</span> Authorized personnel only · Secure access
            </div>
          </div>
          <footer>
            © {new Date().getFullYear()} Indef Manufacturing Limited
          </footer>
        </section>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }

        /* Outer Container with Warehouse Background */
        .daedalus-login {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          background: linear-gradient(135deg, rgba(10, 20, 37, 0.88), rgba(16, 35, 68, 0.82)),
                      url(${WarehouseBg}) center/cover no-repeat fixed;
          font-family: Inter, 'Segoe UI', system-ui, sans-serif;
          color: #172033;
        }

        /* Glass / Card Shell */
        .daedalus-shell {
          width: min(1080px, 100%);
          min-height: 640px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 35px 100px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
        }

        /* Left Hero Panel with Scissor Lift Background Image */
        .daedalus-hero {
          position: relative;
          isolation: isolate;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 38px 44px;
          color: white;
          overflow: hidden;
          background: url(${ScissorLift}) center/cover no-repeat;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .daedalus-hero::before {
          content: '';
          position: absolute;
          z-index: -1;
          inset: 0;
          background: linear-gradient(to top, rgba(7, 18, 38, 0.95) 10%, rgba(10, 24, 49, 0.6) 80%);
        }

        .hero-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-daedalus-logo {
          height: 52px;
          object-fit: contain;
          margin: 0;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
        }

        .hero-kicker {
          font-size: 11px;
          letter-spacing: 2.6px;
          font-weight: 800;
          color: #93c5fd;
        }

        .hero-content h1 {
          font-size: clamp(34px, 3.8vw, 48px);
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin: 10px 0;
          font-weight: 800;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        .hero-content p {
          color: #d1e2f8;
          line-height: 1.6;
          font-size: 13.5px;
          margin: 0;
          max-width: 360px;
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
        }

        /* Right Form Panel */
        .daedalus-form-panel {
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 42px 56px 25px;
        }

        .form-inner {
          width: 100%;
          max-width: 375px;
          margin: auto;
          text-align: center;
        }

        .company-logo {
          display: block;
          height: 52px;
          max-width: 210px;
          object-fit: contain;
          // margin: 0 auto 24px;
        }

        .mobile-brand { display: none; }

        .form-eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          color: ${ACCENT};
        }

        .form-inner h2 {
          font-size: 28px;
          letter-spacing: -1px;
          margin: 8px 0 4px;
        }

        .form-subtitle {
          color: #718096;
          font-size: 14px;
          margin: 0 0 28px;
        }

        .auth-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .microsoft-button, .primary-button {
          height: 48px;
          width: 100%;
          border-radius: 10px;
          font: 600 14px Inter, 'Segoe UI', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .microsoft-button {
          border: 1px solid #d5dce7;
          background: #fff;
          color: #243247;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .microsoft-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .primary-button {
          background: ${ACCENT};
          border: 1px solid ${ACCENT};
          color: white;
          justify-content: space-between;
          padding: 0 20px;
        }

        .primary-button:hover {
          background: #1d4ed8;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .primary-button span { font-size: 18px; }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #8994a6;
          font-size: 11px;
        }

        .auth-divider:before, .auth-divider:after {
          content: '';
          height: 1px;
          background: #e4e8ef;
          flex: 1;
        }

        .daedalus-form-panel label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #344054;
          margin: 16px 0 6px;
        }

        .daedalus-form-panel input {
          width: 100%;
          height: 46px;
          border: 1px solid #d8e0eb;
          border-radius: 9px;
          background: #f9fbfe;
          padding: 0 14px;
          font-size: 14px;
          outline: none;
          color: #172033;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .daedalus-form-panel input:focus {
          border-color: ${ACCENT};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          background: white;
        }

        .daedalus-form-panel input[aria-invalid=true] {
          border-color: ${ERROR};
        }

        .password-wrap { position: relative; }
        .password-wrap input { padding-right: 67px; }
        
        .password-wrap button {
          position: absolute;
          right: 8px;
          top: 7px;
          height: 32px;
          padding: 0 10px;
          border: 0;
          background: transparent;
          color: #4c6383;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
        }

        .field-error {
          display: block;
          color: ${ERROR};
          font-size: 11px;
          margin-top: 5px;
        }

        .login-submit { margin-top: 22px; }

        .back-button {
          display: block;
          margin: 18px auto 0;
          background: none;
          border: 0;
          color: ${ACCENT};
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
        }

        .auth-error {
          padding: 12px 14px;
          margin-bottom: 20px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fff1f2;
          color: #b91c1c;
          font-size: 12px;
          line-height: 1.5;
        }

        .auth-loading {
          min-height: 175px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #41516b;
        }

        .spinner {
          height: 35px;
          width: 35px;
          border-radius: 50%;
          border: 3px solid #dbeafe;
          border-top-color: ${ACCENT};
          animation: daedalus-spin .8s linear infinite;
        }

        @keyframes daedalus-spin {
          to { transform: rotate(360deg); }
        }

        .secure-note {
          text-align: center;
          margin-top: 30px;
          color: #8b98aa;
          font-size: 11px;
        }

        .secure-note span {
          color: #16a34a;
          margin-right: 5px;
        }

        .daedalus-form-panel footer {
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          padding-top: 20px;
        }

        @media(max-width: 860px) {
          .daedalus-form-panel { padding: 38px 30px 24px; }
          .daedalus-hero { padding: 32px 28px; }
        }

        @media(max-width: 680px) {
          .daedalus-login { padding: 16px; }
          .daedalus-shell { grid-template-columns: 1fr; min-height: auto; }
          .daedalus-hero { display: none; }
          .daedalus-form-panel { min-height: 580px; border-radius: 24px; }
          .mobile-brand {
            display: block;
            text-align: center;
            letter-spacing: 2px;
            color: #2563eb;
            font-size: 11px;
            font-weight: 800;
            margin-bottom: 24px;
          }
        }
      `}</style>
    </main>
  );
}
