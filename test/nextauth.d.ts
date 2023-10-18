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
