import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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

        // Create new user
        const user = await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                password: hashedPassword,
                displayName,
            }
        });

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: 500 }
        );
    }
}
