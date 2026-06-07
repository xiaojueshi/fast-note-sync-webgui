import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorizeStart,
  authorizeSubmit,
  buildOAuthAuthorizeRequest,
  getMissingOAuthAuthorizeFields,
} from "./oauth-authorize";

describe("buildOAuthAuthorizeRequest", () => {
  it("parses ChatGPT OAuth authorize query parameters", () => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: "connected-app-live-test",
      redirect_uri: "https://chatgpt.com/connector/oauth/callback",
      scope: "openid email notes:read",
      state: "oauth_state",
      nonce: "nonce",
      code_challenge: "challenge",
      code_challenge_method: "S256",
      resource: "https://obsidian-fns.kahub.in/api/mcp",
    });

    expect(buildOAuthAuthorizeRequest(params)).toEqual({
      response_type: "code",
      client_id: "connected-app-live-test",
      redirect_uri: "https://chatgpt.com/connector/oauth/callback",
      scope: "openid email notes:read",
      state: "oauth_state",
      nonce: "nonce",
      code_challenge: "challenge",
      code_challenge_method: "S256",
      resource: "https://obsidian-fns.kahub.in/api/mcp",
    });
  });

  it("defaults response_type to code and reports missing required fields", () => {
    const request = buildOAuthAuthorizeRequest(new URLSearchParams());

    expect(request.response_type).toBe("code");
    expect(getMissingOAuthAuthorizeFields(request)).toEqual([
      "client_id",
      "redirect_uri",
    ]);
  });
});

describe("OAuth authorize API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts authorize start with bearer token and returns response data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1,
        data: {
          consent_required: true,
          scope_results: [{ scope: "notes:read", description: "Read notes" }],
        },
      }),
    } as Response);

    const request = buildOAuthAuthorizeRequest(
      new URLSearchParams({
        client_id: "client",
        redirect_uri: "https://chatgpt.com/callback",
      }),
    );

    await expect(authorizeStart(request, "fns-token")).resolves.toEqual({
      consent_required: true,
      scope_results: [{ scope: "notes:read", description: "Read notes" }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/oauth/stytch/authorize/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(request),
        headers: expect.objectContaining({
          Authorization: "Bearer fns-token",
          "Content-Type": "application/json",
          "X-Client": "WebGui",
        }),
      }),
    );
  });

  it("posts authorize submit with consent_granted and returns redirect uri", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1,
        data: {
          redirect_uri: "https://chatgpt.com/connector/oauth/callback?code=abc",
        },
      }),
    } as Response);

    const request = buildOAuthAuthorizeRequest(
      new URLSearchParams({
        client_id: "client",
        redirect_uri: "https://chatgpt.com/callback",
      }),
    );

    await expect(authorizeSubmit(request, "fns-token", true)).resolves.toEqual({
      redirect_uri: "https://chatgpt.com/connector/oauth/callback?code=abc",
    });
  });
});
