const API_BASE_URL =
  window.APP_CONFIG?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL;
const AUTH_TOKEN =
  window.APP_CONFIG?.AUTH_TOKEN || import.meta.env.VITE_AUTH_TOKEN;

export { API_BASE_URL, AUTH_TOKEN };
