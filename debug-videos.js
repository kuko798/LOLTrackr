const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const videos = await prisma.video.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            title: true,
            processingStatus: true,
            originalVideoUrl: true,
            processedVideoUrl: true,
            thumbnailUrl: true,
            createdAt: true,
        }
    });

    console.log('\n=== RECENT VIDEOS ===\n');
    videos.forEach((video, i) => {
        console.log(`Video ${i + 1}: ${video.title}`);
        console.log(`  ID: ${video.id}`);
        console.log(`  Status: ${video.processingStatus}`);
        console.log(`  Created: ${video.createdAt}`);
        console.log(`  Original URL: ${video.originalVideoUrl || 'NULL'}`);
        console.log(`  Processed URL: ${video.processedVideoUrl || 'NULL'}`);
        console.log(`  Thumbnail URL: ${video.thumbnailUrl || 'NULL'}`);
        console.log('');
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
