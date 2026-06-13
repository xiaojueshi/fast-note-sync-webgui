export interface OIDCProvider {
  id: string
  displayName: string
  startUrl: string
}

interface OIDCConfig {
  enabled?: boolean
  providers?: unknown
  displayName?: unknown
  startUrl?: unknown
}

interface OIDCProviderConfig {
  id?: unknown
  displayName?: unknown
  startUrl?: unknown
}

function isRecord(config: unknown): config is Record<string, unknown> {
  return typeof config === "object" && config !== null
}

function normalizeOIDCProvider(provider: unknown): OIDCProvider | null {
  if (!isRecord(provider)) return null
  const providerConfig = provider as OIDCProviderConfig
  if (typeof providerConfig.id !== "string") return null
  if (typeof providerConfig.displayName !== "string") return null
  if (typeof providerConfig.startUrl !== "string") return null
  return {
    id: providerConfig.id,
    displayName: providerConfig.displayName,
    startUrl: providerConfig.startUrl,
  }
}

export function normalizeOIDCProviders(config: unknown): OIDCProvider[] {
  if (!isRecord(config)) return []
  const oidcConfig = config as OIDCConfig
  if (!oidcConfig.enabled) return []

  if (Array.isArray(oidcConfig.providers)) {
    const providers = oidcConfig.providers
      .map(normalizeOIDCProvider)
      .filter((provider): provider is OIDCProvider => provider !== null)
    if (providers.length > 0) return providers
  }

  if (typeof oidcConfig.displayName !== "string" || typeof oidcConfig.startUrl !== "string") {
    return []
  }

  return [{
    id: "oidc",
    displayName: oidcConfig.displayName,
    startUrl: oidcConfig.startUrl,
  }]
}
