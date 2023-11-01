import { NextAuthOptions } from 'next-auth';
import Subrite, { refreshAccessToken, toSubriteJWT } from '../src';

const subriteConfig = {
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  subriteUrl: 'your-subrite-url',
};

export const options: NextAuthOptions = {
  providers: [Subrite(subriteConfig)],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // Initial sign in
        return {
          ...token,
          ...toSubriteJWT(account),
          user,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      return refreshAccessToken(token, subriteConfig);
    },
    async session({ session, token }) {
      return { ...session, accessToken: token.accessToken };
    },
  },
};
