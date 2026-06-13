import { describe, expect, it } from "vitest";

import { normalizeOIDCProviders } from "./auth-oidc";

describe("normalizeOIDCProviders", () => {
  it("returns configured providers from the new OIDC config shape", () => {
    expect(normalizeOIDCProviders({
      enabled: true,
      providers: [
        { id: "dex", displayName: "Login with Dex", startUrl: "/api/user/auth/oidc/start/dex" },
        { id: "keycloak", displayName: "Login with Keycloak", startUrl: "/api/user/auth/oidc/start/keycloak" },
      ],
    })).toEqual([
      { id: "dex", displayName: "Login with Dex", startUrl: "/api/user/auth/oidc/start/dex" },
      { id: "keycloak", displayName: "Login with Keycloak", startUrl: "/api/user/auth/oidc/start/keycloak" },
    ]);
  });

  it("keeps compatibility with the old single-provider OIDC config shape", () => {
    expect(normalizeOIDCProviders({
      enabled: true,
      displayName: "Login with Dex",
      startUrl: "/api/user/auth/oidc/start",
    })).toEqual([
      { id: "oidc", displayName: "Login with Dex", startUrl: "/api/user/auth/oidc/start" },
    ]);
  });

  it("returns no providers when OIDC is disabled or provider data is incomplete", () => {
    expect(normalizeOIDCProviders({
      enabled: false,
      providers: [
        { id: "dex", displayName: "Login with Dex", startUrl: "/api/user/auth/oidc/start/dex" },
      ],
    })).toEqual([]);

    expect(normalizeOIDCProviders({
      enabled: true,
      providers: [
        { id: "dex", displayName: "Login with Dex" },
      ],
    })).toEqual([]);
  });

  it("falls back to legacy single-provider fields when providers are incomplete", () => {
    expect(normalizeOIDCProviders({
      enabled: true,
      providers: [],
      displayName: "Login with OIDC",
      startUrl: "/api/user/auth/oidc/start",
    })).toEqual([
      { id: "oidc", displayName: "Login with OIDC", startUrl: "/api/user/auth/oidc/start" },
    ]);
  });
});
