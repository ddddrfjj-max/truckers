import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    refreshToken: string;
    error?: string;
    user: {
      id: string;
      email: string;
      role: string;
      name?: string;
      image?: string;
    };
  }
  interface User {
    role: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    accessToken: string;
    refreshToken: string;
  }
}
