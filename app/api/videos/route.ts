import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = parseInt(searchParams.get('skip') || '0');
        const userId = searchParams.get('userId');
        const trending = searchParams.get('trending') === 'true';

        // Build query
        const where: any = {};

        if (status) {
            where.processingStatus = status;
        }

        if (userId) {
            where.userId = userId;
        }

        // Fetch videos with user information
        let videos: any[];
        try {
            videos = await prisma.video.findMany({
                where,
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
                },
                orderBy: trending ? {
                    likes: {
                        _count: 'desc'
                    }
                } : {
                    createdAt: 'desc'
                },
                take: limit,
                skip: skip,
            });
        } catch (error: any) {
            // Fallback if Like/Comment tables are not created yet.
            if (typeof error?.message === 'string' && error.message.includes('relation')) {
                const fallbackVideos = await prisma.video.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                username: true,
                                displayName: true,
                                avatarUrl: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: limit,
                    skip: skip,
                });
                videos = fallbackVideos.map((video) => ({
                    ...video,
                    _count: { likes: 0, comments: 0 },
                    likes: [],
                }));
            } else {
                throw error;
            }
        }

        const serializedVideos = videos.map((video: any) => ({
            ...video,
            likesCount: video._count.likes,
            commentsCount: video._count.comments,
            likedByCurrentUser: Array.isArray(video.likes) ? video.likes.length > 0 : false,
        }));

        const finalVideos = trending
            ? serializedVideos
                .sort((a: any, b: any) => {
                    const ageHoursA = Math.max(
                        1,
                        (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60)
                    );
                    const ageHoursB = Math.max(
                        1,
                        (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60)
                    );
                    const scoreA = a.likesCount / ageHoursA;
                    const scoreB = b.likesCount / ageHoursB;
                    return scoreB - scoreA;
                })
            : serializedVideos;

        const total = await prisma.video.count({ where });

        return NextResponse.json({
            videos: finalVideos,
            total,
            hasMore: skip + limit < total,
        });
    } catch (error: any) {
        console.error('Fetch videos error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch videos' },
            { status: 500 }
        );
    }
}
