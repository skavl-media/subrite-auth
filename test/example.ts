import { NextAuthOptions } from "next-auth";
import Subrite from "../src";

export const options: NextAuthOptions = {
  providers: [
    Subrite({
      clientId: "your-client-id",
      clientSecret: "your-client-secret",
      subriteUrl: "your-subrite-url"
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      return {
        ...token,
        accessToken: user.accessToken
      };
    },
    async session({ session, token }) {
      return { ...session, accessToken: token.accessToken };
    }
  }
};
