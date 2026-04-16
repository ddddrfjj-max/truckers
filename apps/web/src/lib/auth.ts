import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

async function refreshAccessToken(refreshToken: string) {
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken ?? refreshToken,
      accessTokenExpiry: Date.now() + 14 * 60 * 1000,
      error: undefined,
    };
  } catch {
    return { error: 'RefreshAccessTokenError' };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });
          const data = res.data;
          if (data.accessToken && data.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              role: data.user.role,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, populate token fields
      if (user) {
        return {
          ...token,
          id: user.id,
          role: (user as any).role,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          accessTokenExpiry: Date.now() + 14 * 60 * 1000,
        };
      }

      // Access token still valid — return as-is
      if (Date.now() < (token.accessTokenExpiry as number)) {
        return token;
      }

      // Access token expired — try to refresh
      const refreshed = await refreshAccessToken(token.refreshToken as string);
      if (refreshed.error) {
        return { ...token, error: 'RefreshAccessTokenError' };
      }
      return { ...token, ...refreshed };
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
