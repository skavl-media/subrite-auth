import { TokenSet, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';

export interface SubriteJWT {
  accessToken: string;
  refreshToken: string;
  // Milliseconds since epoch, which is easy to compare with Date.now()
  accessTokenExpires: number;
}

export interface SubriteProfile extends SubriteJWT {
  sub: string;
  name: string;
  email: string;
  image: string;
}

export type SubriteConfig = OAuthUserConfig<SubriteProfile> & {
  subriteUrl: string;
};

export default function Subrite(config: SubriteConfig): OAuthConfig<SubriteProfile> {
  const { subriteUrl } = config;
  return {
    id: 'subrite',
    name: 'Subrite',
    type: 'oauth',
    version: '2.0',
    wellKnown: new URL('/api/oidc/.well-known/openid-configuration', subriteUrl).href,
    checks: ['pkce', 'state'],
    authorization: {
      params: {
        scope: 'openid offline_access',
      },
    },
    async profile(profile, tokens): Promise<User & SubriteJWT> {
      const { access_token, refresh_token, expires_at } = getTokens(tokens);
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.image,
        accessToken: access_token,
        refreshToken: refresh_token,
        // expires_at is in seconds, so we convert to milliseconds
        accessTokenExpires: expires_at,
      };
    },
    options: config,
  };
}

function getTokens(tokens: TokenSet): {
  refresh_token: string;
  access_token: string;
  expires_at: number;
} {
  const { access_token, refresh_token, expires_at } = tokens;
  if (!access_token) {
    throw new Error('No access_token');
  }
  if (!refresh_token) {
    throw new Error('No refresh_token');
  }
  if (!expires_at) {
    throw new Error('No expires_at');
  }
  return { access_token, refresh_token, expires_at };
}

type RefreshParams = {
  subriteUrl: string;
  clientId: string;
  clientSecret: string;
};

// https://next-auth.js.org/v3/tutorials/refresh-token-rotation#server-side
export async function refreshAccessToken(
  token: JWT & SubriteJWT,
  params: RefreshParams,
): Promise<JWT & SubriteJWT> {
  const { subriteUrl, clientId, clientSecret } = params;
  const url = new URL('/api/oidc/token', subriteUrl);
  const form = new URLSearchParams();
  form.append('grant_type', 'refresh_token');
  form.append('client_id', clientId);
  form.append('client_secret', clientSecret);
  form.append('refresh_token', token.refreshToken);
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
    body: form,
  });

  const refreshedTokens: TokenSet = await response.json();

  if (!response.ok) {
    throw refreshedTokens;
  }

  if (typeof refreshedTokens.expires_in !== 'number') {
    console.error('No expires_in number in refreshedTokens', refreshedTokens);
    throw new Error('No expires_at');
  }

  // The OIDC spec returns expires_in in seconds.
  const expiresInSeconds = refreshedTokens.expires_in;
  const refreshedTokensWithExpiry: SubriteJWT = {
    ...token,
    accessTokenExpires: Date.now() + expiresInSeconds * 1000,
  };

  return refreshedTokensWithExpiry;
}

export function generatePostSignOutUrl(
  subriteUrl: string | URL,
  clientId: string,
  postLogoutRedirectUri: string,
): string {
  const subriteSignoutUrl = new URL('/api/oidc/session/end', subriteUrl);
  // Tell subrite what client we are signing out from
  subriteSignoutUrl.searchParams.append('client_id', clientId);
  // Tell subrite where to send the user agent after signing out
  subriteSignoutUrl.searchParams.append('post_logout_redirect_uri', postLogoutRedirectUri);
  return subriteSignoutUrl.toString();
}
