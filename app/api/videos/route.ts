import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = parseInt(searchParams.get('skip') || '0');
        const userId = searchParams.get('userId');

        // Build query
        const where: any = {};

        if (status) {
            where.processingStatus = status;
        }

        if (userId) {
            where.userId = userId;
        }

        // Fetch videos with user information
        const videos = await prisma.video.findMany({
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

        const total = await prisma.video.count({ where });

        return NextResponse.json({
            videos,
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
