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

If your application is using NextAuth.js, you can use the `@subrite/next-auth-provider` NPM module to generate this link.

The `STATE` and `CODE_CHALLENGE` will be provied by your OAuth library.

## Obtaining an access token

