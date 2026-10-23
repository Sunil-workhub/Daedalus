export const msalConfig = {
  auth: {
    clientId: "418dbbc7-a268-42a8-ae04-4741e2914766",
    authority:
      "https://login.microsoftonline.com/458b353b-34ce-425a-9d53-815389752792",
    redirectUri: window.location.origin + "/daedalus-login",
    postLogoutRedirectUri: window.location.origin + "/daedalus-login",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
