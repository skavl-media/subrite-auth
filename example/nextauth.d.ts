// Read more at: https://next-auth.js.org/getting-started/typescript#module-augmentation
import { DefaultSession } from 'next-auth';
import { SubriteJWT, SubriteProfile } from '../src';

declare module 'next-auth' {
  interface User extends SubriteJWT {}

  interface Session {
    user: DefaultSession['user'] & SubriteProfile;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends SubriteJWT {}
}
