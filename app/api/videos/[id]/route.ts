import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const video = await prisma.video.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    }
                }
            }
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        return NextResponse.json({ video });
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
    { params }: { params: { id: string } }
) {
    try {
        const { title, description } = await req.json();

        const video = await prisma.video.update({
            where: { id: params.id },
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
    { params }: { params: { id: string } }
) {
    try {
        const video = await prisma.video.delete({
            where: { id: params.id }
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
