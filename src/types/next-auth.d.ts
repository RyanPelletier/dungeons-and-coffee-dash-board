import "next-auth";
import "next-auth/jwt";

export type Role = "PLAYER" | "DM";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      isScribe: boolean;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    id: string;
    role: Role;
    isScribe: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    isScribe: boolean;
  }
}
