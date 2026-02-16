import type { DefaultSession, NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import TwitterProvider from 'next-auth/providers/twitter';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            username: string;
        } & DefaultSession['user'];
    }

    interface User {
        username: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please provide email and password');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error('No user found with this email');
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error('Invalid password');
                }

                if (!user.emailVerified) {
                    throw new Error('Please verify your email before signing in');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.displayName,
                    username: user.username,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signin',
        error: '/auth/signin',
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
            }

            if (account && ['google', 'facebook', 'twitter'].includes(account.provider) && user?.email) {
                let dbUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!dbUser) {
                    const baseUsername = user.email
                        .split('@')[0]
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, '')
                        .slice(0, 20) || 'user';

                    for (let attempt = 0; attempt < 10; attempt++) {
                        const candidate = attempt === 0 ? baseUsername : `${baseUsername}${attempt}`;
                        try {
                            dbUser = await prisma.user.create({
                                data: {
                                    email: user.email,
                                    username: candidate,
                                    displayName: user.name || candidate,
                                    password: await bcrypt.hash(Math.random().toString(36), 10),
                                    avatarUrl: user.image || '',
                                    emailVerified: true,
                                },
                            });
                            break;
                        } catch (error) {
                            if (
                                error instanceof Prisma.PrismaClientKnownRequestError &&
                                error.code === 'P2002'
                            ) {
                                continue;
                            }
                            throw error;
                        }
                    }

                    if (!dbUser) {
                        throw new Error('Failed to create OAuth user');
                    }
                }

                token.id = dbUser.id;
                token.username = dbUser.username;
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    authOptions.providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    authOptions.providers.push(
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        })
    );
}

if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    authOptions.providers.push(
        TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
            version: '2.0',
        })
    );
}
