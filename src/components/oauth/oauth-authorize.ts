import env from "@/env.ts";
import { buildApiHeaders } from "@/lib/utils/api-headers";

export interface OAuthAuthorizeRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  nonce: string;
  code_challenge: string;
  code_challenge_method: string;
  resource: string;
}

export interface OAuthScopeResult {
  scope: string;
  description?: string;
}

export interface OAuthClientInfo {
  client_name?: string;
}

export interface OAuthAuthorizeStartResponse {
  consent_required: boolean;
  client?: OAuthClientInfo;
  scope_results?: OAuthScopeResult[];
}

export interface OAuthAuthorizeSubmitResponse {
  redirect_uri: string;
}

interface ApiResponse<T> {
  code: number;
  message?: string;
  details?: string;
  data: T;
}

export function buildOAuthAuthorizeRequest(params: URLSearchParams): OAuthAuthorizeRequest {
  return {
    client_id: params.get("client_id") || "",
    redirect_uri: params.get("redirect_uri") || "",
    response_type: params.get("response_type") || "code",
    scope: params.get("scope") || "",
    state: params.get("state") || "",
    nonce: params.get("nonce") || "",
    code_challenge: params.get("code_challenge") || "",
    code_challenge_method: params.get("code_challenge_method") || "",
    resource: params.get("resource") || "",
  };
}

export function getMissingOAuthAuthorizeFields(request: OAuthAuthorizeRequest): string[] {
  return ["client_id", "redirect_uri"].filter((field) => !request[field as keyof OAuthAuthorizeRequest]);
}

async function postOAuthAuthorize<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  const response = await fetch(env.API_URL + path, {
    method: "POST",
    headers: buildApiHeaders({ token }),
    body: JSON.stringify(body),
  });
  const payload = await response.json() as ApiResponse<T>;
  if (!response.ok || !(payload.code > 0 && payload.code < 100)) {
    throw new Error(payload.details || payload.message || "OAuth authorization request failed");
  }
  return payload.data;
}

export function authorizeStart(
  request: OAuthAuthorizeRequest,
  token: string,
): Promise<OAuthAuthorizeStartResponse> {
  return postOAuthAuthorize<OAuthAuthorizeStartResponse>(
    "/api/oauth/stytch/authorize/start",
    request,
    token,
  );
}

export function authorizeSubmit(
  request: OAuthAuthorizeRequest,
  token: string,
  consentGranted: boolean,
): Promise<OAuthAuthorizeSubmitResponse> {
  return postOAuthAuthorize<OAuthAuthorizeSubmitResponse>(
    "/api/oauth/stytch/authorize/submit",
    {
      ...request,
      consent_granted: consentGranted,
    },
    token,
  );
}
