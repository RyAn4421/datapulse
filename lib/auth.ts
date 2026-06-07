import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials?.email });
        if (!user || !credentials?.password) return null;

        // Match user.passwordHash or fallback to user.password for compatibility
        const hash = user.passwordHash || user.password;
        if (!hash) return null;

        const valid = await bcrypt.compare(credentials.password, hash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    // Auto-create Google users in MongoDB on first sign-in
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectDB();
          const existing = await User.findOne({ email: user.email });
          if (!existing) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              passwordHash: '', // no password for OAuth users
              role: 'admin',
            });
          }
        } catch (e) {
          console.error('[auth] Error creating Google user:', e);
          return false;
        }
      }
      return true;
    },

    // Expose DB user id in JWT token
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // For Google sign-ins, resolve the real MongoDB _id
      if (account?.provider === 'google' && token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) token.id = dbUser._id.toString();
        } catch (_) {}
      }
      return token;
    },

    // Forward user id to the session object
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id ?? token.sub;
      }
      return session;
    },

    // Always send to /dashboard after sign-in
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return `${baseUrl}/dashboard`;
    },
  },

  pages: {
    signIn: '/login',
    newUser: '/dashboard', // new Google accounts land on /dashboard
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};

