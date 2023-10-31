import { TokenSet, User } from "next-auth";
import { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export interface SubriteProfile {
  sub: string;
  name: string;
  email: string;
  image: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
}

export interface SubriteUser {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
}

export type SubriteConfig = OAuthUserConfig<SubriteProfile> & {
  subriteUrl: string;
};

export default function Subrite(
  config: SubriteConfig
): OAuthConfig<SubriteProfile> {
  const { clientId, clientSecret, subriteUrl } = config;
  return {
    id: "subrite",
    name: "Subrite",
    type: "oauth",
    version: "2.0",
    wellKnown: new URL("/api/oidc/.well-known/openid-configuration", subriteUrl)
      .href,
    checks: ["pkce", "state"],
    authorization: {
      params: {
        scope: "openid offline_access"
      }
    },
    async profile(profile, tokens): Promise<User & SubriteUser> {
      if (tokens.expires_at && tokens.expires_at < Date.now()) {
        const { refresh_token } = getTokens(tokens);
        tokens = await refreshAccessToken({
          subriteUrl,
          clientId,
          clientSecret,
          refreshToken: refresh_token
        });
      }

      const { access_token, refresh_token, expires_at } = getTokens(tokens);
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.image,
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpires: expires_at
      };
    },
    options: config
  };
}

function getTokens(tokens: TokenSet): {
  refresh_token: string;
  access_token: string;
  expires_at: number;
} {
  const { access_token, refresh_token, expires_at } = tokens;
  if (!access_token) {
    throw new Error("No access_token");
  }
  if (!refresh_token) {
    throw new Error("No refresh_token");
  }
  if (!expires_at) {
    throw new Error("No expires_at");
  }
  return { access_token, refresh_token, expires_at };
}

type RefreshParams = {
  subriteUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

// https://next-auth.js.org/v3/tutorials/refresh-token-rotation#server-side
export async function refreshAccessToken({
  subriteUrl,
  clientId,
  clientSecret,
  refreshToken
}: RefreshParams): Promise<TokenSet> {
  const url = new URL("/api/oidc/token", subriteUrl);
  const form = new URLSearchParams();
  form.append("grant_type", "refresh_token");
  form.append("client_id", clientId);
  form.append("client_secret", clientSecret);
  form.append("refresh_token", refreshToken);
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST",
    body: form
  });

  const refreshedTokens: TokenSet = await response.json();

  if (!response.ok) {
    throw refreshedTokens;
  }

  if (typeof refreshedTokens.expires_in !== "number") {
    console.error("No expires_in number in refreshedTokens", refreshedTokens);
    throw new Error("No expires_at");
  }

  const refreshedTokensWithExpiry: TokenSet = {
    ...refreshedTokens,
    expires_at: Date.now() + refreshedTokens.expires_in * 1000
  };

  return refreshedTokensWithExpiry;
}

export function generatePostSignOutUrl(
  subriteUrl: string | URL,
  clientId: string,
  postLogoutRedirectUri: string
): string {
  const subriteSignoutUrl = new URL("/api/oidc/session/end", subriteUrl);
  // Tell subrite what client we are signing out from
  subriteSignoutUrl.searchParams.append("client_id", clientId);
  // Tell subrite where to send the user agent after signing out
  subriteSignoutUrl.searchParams.append(
    "post_logout_redirect_uri",
    postLogoutRedirectUri
  );
  return subriteSignoutUrl.toString();
}
