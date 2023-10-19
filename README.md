# Subrite Auth

Subrite Auth is an authentication service for web sites using Subrite.

It is based on OAuth 2.0 and OpenID Connect.

This guide walks through the steps required to use Subrite Auth

## Registering a Subrite Application

To use Subrite Auth, you must first register your application with Subrite.
You must provide a `REDIRECT_URI` for your application. This is the URL where
Subrite Auth will redirect the user after they have logged in.

Once you have registered your application, you will be given a `CLIENT_ID` and a `CLIENT_SECRET`. You will also be given a `SUBRITE_URL`, which is the URL of the Subrite server you will be using.

## Creating a login link

To log in a user, you must first create a login link.
The example below is an example (with line breaks for readability).
All parameters must be URL encoded.

    {SUBRITE_URL}/api/oidc/auth
      ?client_id={CLIENT_ID}
      &scope=openid%20offline_access
      &response_type=code
      &redirect_uri={REDIRECT_URI}
      &state={STATE}
      &code_challenge={CODE_CHALLENGE}
      &code_challenge_method=S256

It's strongly recommended that you use an OAuth library to generate this link.
You need to use PKCE.

The `STATE` and `CODE_CHALLENGE` will be provied by your OAuth library.

## Logging out

When you implement logout in your application, you must make sure to log the user out from Subrite as well as your application.

You should log out from Subrite first, and then log out from your application.

To log out from Subrite, the browser must visit the Subrite logout endpoint.
The Subrite logout endpoint will then redirect back to the your application's configured `post_logout_redirect_uri`

The following JavaScript code illustrates how to construct a logout URL for Subrite:

```typescript
// Construct a URL object for the Subrite sign out endpoint.
const subriteSignoutUrl = new URL('/api/oidc/session/end', subriteUrl);
// Tell subrite what client we are signing out from
subriteSignoutUrl.searchParams.append('client_id', clientId);
// Tell subrite where to send the user agent after signing out (where we sign out from the application)
const postLogoutRedirectUri = new URL('/logout', process.env.NEXT_PUBLIC_NEXTAUTH_URL!).href
subriteSignoutUrl.searchParams.append('post_logout_redirect_uri', postLogoutRedirectUri);
```

The `postLogoutRedirectUri` must be one of the `post_logout_redirect_uri` values configured for your application in Subrite.

```tsx
<!-- This link initiates the sign out flow -->
<a href={subriteSignoutUrl.href}>Sign Out</a>
```

The `/logout` page where the browser is redirected to should clear the user's appplication session.
Below is an example that uses NextAuth.js:

```tsx
import { signOut } from "next-auth/react"
import { useEffect } from "react"

export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: process.env.NEXT_PUBLIC_NEXTAUTH_URL })
  })

  return (
    <pre>Signing out...</pre>
  )
}
```

## NextAuth.js

If your application uses [NextAuth.js](https://next-auth.js.org/), you can use the `@subrite/next-auth-provider` NPM module.

### Installation

    npm install @subrite/next-auth-provider

### NextAuth Configuration

Configure NextAuth to use the Subrite provider:

```typescript
import { NextAuthOptions } from "next-auth";
import Subrite from "@subrite/next-auth-provider";

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
```

### TypeScript Configuration 

(You can skip this step if you are not using TypeScript)

NextAuth provides some built-in types for TypeScript that [can be augmented](https://next-auth.js.org/getting-started/typescript#module-augmentation) with custom properties.

Add Subrite-specific properties:

```typescript
// next-auth.d.ts
// Read more at: https://next-auth.js.org/getting-started/typescript#module-augmentation
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    accessToken: string;
    refreshToken: string;
  }
  interface Session {
    user: DefaultSession["user"] & import("../src").SubriteProfile;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
  }
}
```
