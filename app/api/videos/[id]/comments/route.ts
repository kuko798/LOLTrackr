import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: videoId } = await context.params;
        const comments = await prisma.comment.findMany({
            where: { videoId },
            include: {
                user: {
                    select: {
                        username: true,
                        displayName: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100,
        });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error('Fetch comments error:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: videoId } = await context.params;
        const { content } = await req.json();

        if (!content || typeof content !== 'string' || !content.trim()) {
            return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
        }

        const comment = await prisma.comment.create({
            data: {
                videoId,
                userId: session.user.id,
                content: content.trim().slice(0, 500),
            },
            include: {
                user: {
                    select: {
                        username: true,
                        displayName: true,
                    }
                }
            }
        });

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error('Create comment error:', error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}
