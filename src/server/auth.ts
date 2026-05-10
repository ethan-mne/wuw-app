import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { env } from '@/env';
import { db } from '@/server/db';
import { sendVerificationRequest } from '@/lib/sendVerificationRequest';
import { faker } from '@faker-js/faker';
import { cookies } from 'next/headers';
import { authorizeOtpCredentials } from '@/server/otp-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
    };
  }
}

interface GoogleProfile {
  sub: string;
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
}

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    EmailProvider({
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await sendVerificationRequest({ identifier: email, url });
      },
    }),
    CredentialsProvider({
      id: 'otp',
      credentials: {
        otpID: { label: 'OTP ID', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      authorize: async (credentials) =>
        authorizeOtpCredentials(credentials, db.oTP),
    }),
  ],
  pages: {
    signIn: '/api/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        const existingUser = await db.user.findFirst({
          where: {
            email: user.email,
          },
        });
        if (existingUser) {
          return true;
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      if (new URL(url).origin === baseUrl) {
        return url;
      }

      return baseUrl;
    },
  },
  jwt: {
    secret: env.NEXTAUTH_SECRET,
  },
  events: {
    createUser: async (message) => {
      await Promise.all([
        db.user.update({
          where: { id: message.user.id },
          data: {
            utm: cookies().get('utm')?.value,
          },
        }),
        await db.referrals.create({
          data: {
            code: faker.string.alphanumeric(8),
            discount_rate: 0.1,
            usage_counter: 0,
            user_id: message.user.id,
          },
        }),
      ]);
    },
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
