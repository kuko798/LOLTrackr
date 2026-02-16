import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                email: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Fetch profile error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { displayName, bio, avatarUrl } = await req.json();

        if (!displayName || typeof displayName !== 'string') {
            return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                displayName: displayName.trim().slice(0, 50),
                bio: typeof bio === 'string' ? bio.trim().slice(0, 280) : null,
                avatarUrl: typeof avatarUrl === 'string' ? avatarUrl.trim().slice(0, 500) : null,
            },
            select: {
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                email: true,
            }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
