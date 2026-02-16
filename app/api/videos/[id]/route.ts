import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await context.params;
        const video = await prisma.video.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                },
                ...(session?.user?.id ? {
                    likes: {
                        where: { userId: session.user.id },
                        select: { id: true }
                    }
                } : {})
            }
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        return NextResponse.json({
            video: {
                ...video,
                likesCount: video._count.likes,
                commentsCount: video._count.comments,
                likedByCurrentUser: Array.isArray(video.likes) ? video.likes.length > 0 : false,
            }
        });
    } catch (error: any) {
        console.error('Fetch video error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch video' },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { title, description } = await req.json();

        const video = await prisma.video.update({
            where: { id },
            data: { title, description }
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        return NextResponse.json({ video });
    } catch (error: any) {
        console.error('Update video error:', error);
        return NextResponse.json(
            { error: 'Failed to update video' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const video = await prisma.video.delete({
            where: { id }
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        // TODO: Delete files from GCS

        return NextResponse.json({ message: 'Video deleted successfully' });
    } catch (error: any) {
        console.error('Delete video error:', error);
        return NextResponse.json(
            { error: 'Failed to delete video' },
            { status: 500 }
        );
    }
}
