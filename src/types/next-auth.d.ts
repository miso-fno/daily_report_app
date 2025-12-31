/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      email: string;
      name: string;
      department: string;
      isManager: boolean;
      managerId: number | null;
    };
  }

  interface User extends DefaultUser {
    id: number;
    email: string;
    name: string;
    department: string;
    isManager: boolean;
    managerId: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: number;
    email: string;
    name: string;
    department: string;
    isManager: boolean;
    managerId: number | null;
  }
}
