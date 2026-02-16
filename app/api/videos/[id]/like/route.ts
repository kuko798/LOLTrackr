import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: videoId } = await context.params;

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_videoId: {
                    userId: session.user.id,
                    videoId,
                }
            }
        });

        let liked = false;
        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            liked = false;
        } else {
            await prisma.like.create({
                data: {
                    userId: session.user.id,
                    videoId,
                }
            });
            liked = true;
        }

        const likesCount = await prisma.like.count({ where: { videoId } });

        return NextResponse.json({ liked, likesCount });
    } catch (error) {
        console.error('Like toggle error:', error);
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
    }
}
