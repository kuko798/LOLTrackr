import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { username, email, password, displayName } = await req.json();

        // Validation
        if (!username || !email || !password || !displayName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email or username already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create new user
        const user = await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                password: hashedPassword,
                displayName,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpiry,
            }
        });

        await sendVerificationEmail(user.email, verificationToken);

        return NextResponse.json(
            {
                message: 'User created successfully. Please verify your email before signing in.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    emailVerified: user.emailVerified,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Signup error:', error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'User with this email or username already exists' },
                    { status: 400 }
                );
            }
        }

        if (error instanceof Prisma.PrismaClientInitializationError) {
            return NextResponse.json(
                { error: 'Service temporarily unavailable. Please try again shortly.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
