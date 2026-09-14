import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateTextVector, EmbeddingService } from '../lib/services/embedding-service';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 2 MemoryVault seed process...');

  // Clean existing data
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.aIAnalysis.deleteMany({});
  await prisma.memoryEmbedding.deleteMany({});
  await prisma.memoryTag.deleteMany({});
  await prisma.memoryStory.deleteMany({});
  await prisma.aISettings.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.contributor.deleteMany({});
  await prisma.timelineEvent.deleteMany({});
  await prisma.memoryMessage.deleteMany({});
  await prisma.memoryVideo.deleteMany({});
  await prisma.memoryPhoto.deleteMany({});
  await prisma.memorySpace.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('demo123', 10);

  // 1. Create Demo Users
  const aditya = await prisma.user.create({
    data: {
      name: 'Aditya Sharma',
      email: 'demo@memoryvault.com',
      password: hashedPassword,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Nair',
      email: 'priya@memoryvault.com',
      password: hashedPassword,
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    },
  });

  const rohan = await prisma.user.create({
    data: {
      name: 'Rohan Gupta',
      email: 'rohan@memoryvault.com',
      password: hashedPassword,
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
  });

  console.log(`👤 Created 3 Users (Aditya, Priya, Rohan)`);

  // 2. Create Rahul Memory Space
  const rahulSpace = await prisma.memorySpace.create({
    data: {
      memoryId: 'MEM-RH-2026-8294',
      ownerId: aditya.id,
      personName: 'Rahul Verma',
      nickname: 'Rahuliya',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      relationship: 'Best Friend',
      description: 'A collection of unbreakable moments, late-night chai, hostel laughter, and college dreams we will always carry with us.',
      birthday: '1998-08-14',
      firstMeetingDate: '2019-07-22',
      specialDate: '2023-05-18',
      phone: '+91 98765 43210',
      email: 'rahul.verma@example.com',
      instagram: '@rahul.v',
      linkedin: 'linkedin.com/in/rahul-verma-demo',
      privacy: 'PUBLIC',
    },
  });

  console.log(`✨ Created Memory Space: ${rahulSpace.personName} (${rahulSpace.memoryId})`);

  // 3. Seed 15 Photos
  const photosData = [
    {
      caption: 'First day at campus canteen. Ordering chai and talking about tech dreams.',
      date: '2019-07-25',
      location: 'Campus Canteen',
      uploadedBy: 'Aditya Sharma',
      fileUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Late night hackathon coding marathon! 3 AM pizza break.',
      date: '2021-11-12',
      location: 'Innovation Lab',
      uploadedBy: 'Priya Nair',
      fileUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Graduation Day memory! Four years flew by like a flash.',
      date: '2023-05-18',
      location: 'Main Auditorium',
      uploadedBy: 'Aditya Sharma',
      fileUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Farewell trip to Manali. Freezing cold but happiest smiles.',
      date: '2026-02-10',
      location: 'Manali, HP',
      uploadedBy: 'Rohan Gupta',
      fileUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Spontaneous weekend road trip to Lonavala lake view point.',
      date: '2020-09-15',
      location: 'Lonavala',
      uploadedBy: 'Aditya Sharma',
      fileUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Hostel terrace acoustic guitar session under the stars.',
      date: '2021-03-20',
      location: 'Hostel B Terrace',
      uploadedBy: 'Priya Nair',
      fileUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Winning 1st prize trophy at National Tech Fest 2021.',
      date: '2021-11-14',
      location: 'IIT Tech Arena',
      uploadedBy: 'Aditya Sharma',
      fileUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Rahul making midnight Maggi in Hostel Room 304 before finals.',
      date: '2022-01-10',
      location: 'Hostel Room 304',
      uploadedBy: 'Rohan Gupta',
      fileUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'College Annual Cultural Fest stage performance preparation.',
      date: '2022-04-05',
      location: 'Open Air Theatre',
      uploadedBy: 'Priya Nair',
      fileUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Farewell party dinner toast with entire batch.',
      date: '2023-05-17',
      location: 'Royal Palms Banquet',
      uploadedBy: 'Aditya Sharma',
      fileUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Rahul relocation airport departure gate farewell hug.',
      date: '2026-09-01',
      location: 'International Airport T2',
      uploadedBy: 'Rohan Gupta',
      fileUrl: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Study break table tennis match in student activity center.',
      date: '2020-02-18',
      location: 'Activity Center',
      uploadedBy: 'Priya Nair',
      fileUrl: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'First semester group photo after completing Signals exam.',
      date: '2019-12-10',
      location: 'Academic Block A',
      uploadedBy: 'Aditya Sharma',
      fileUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Camping night campfire memories in Manali hills.',
      date: '2026-02-11',
      location: 'Manali Campsite',
      uploadedBy: 'Rohan Gupta',
      fileUrl: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80',
    },
    {
      caption: 'Celebratory cake cutting for Rahul 25th birthday.',
      date: '2023-08-14',
      location: 'Hostel Lounge',
      uploadedBy: 'Aditya Sharma',
      fileUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const createdPhotos = [];
  for (const item of photosData) {
    const photo = await prisma.memoryPhoto.create({
      data: {
        memorySpaceId: rahulSpace.id,
        ...item,
      },
    });
    createdPhotos.push(photo);

    // Index vector embedding for semantic search
    await EmbeddingService.indexMemoryContent(
      rahulSpace.id,
      'PHOTO',
      photo.id,
      `${photo.caption} ${photo.location || ''} ${photo.date || ''} ${photo.uploadedBy}`
    );
  }

  console.log(`📸 Seeded 15 Photos & Vector Embeddings`);

  // 4. Seed 4 Videos
  const videosData = [
    {
      title: 'College Fest Rock Concert Jam',
      caption: 'Rahul playing acoustic guitar on stage during annual fest!',
      date: '2022-03-15',
      uploadedBy: 'Aditya Sharma',
      fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Farewell Party Speech & Memories',
      caption: 'Rahul giving his heartfelt farewell speech to the batch.',
      date: '2023-05-17',
      uploadedBy: 'Priya Nair',
      fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Manali Snowball Fight Video',
      caption: 'Spontaneous snow fun during Manali farewell trip!',
      date: '2026-02-12',
      uploadedBy: 'Rohan Gupta',
      fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Hackathon 3 AM Coding Session',
      caption: 'Rahul fixing the final bug seconds before hackathon submission!',
      date: '2021-11-13',
      uploadedBy: 'Aditya Sharma',
      fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
    },
  ];

  for (const item of videosData) {
    const vid = await prisma.memoryVideo.create({
      data: {
        memorySpaceId: rahulSpace.id,
        ...item,
      },
    });

    await EmbeddingService.indexMemoryContent(
      rahulSpace.id,
      'VIDEO',
      vid.id,
      `${vid.title} ${vid.caption} ${vid.date} ${vid.uploadedBy}`
    );
  }

  console.log(`🎥 Seeded 4 Videos & Embeddings`);

  // 5. Seed 8 Memory Messages
  const messagesData = [
    {
      authorId: aditya.id,
      authorName: 'Aditya Sharma',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      title: 'Brothers for life',
      message: 'From sitting on the back bench in Signals & Systems to building our first startup prototype together, Rahul has been the most reliable friend I could ever ask for. Keep shining brother!',
    },
    {
      authorId: priya.id,
      authorName: 'Priya Nair',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      title: 'Never forget the hostel maggi!',
      message: 'Rahul, remember when we accidentally set off the fire alarm while making midnight Maggi in Room 304? Legendary times. Distance won\'t change our bond!',
    },
    {
      authorId: rohan.id,
      authorName: 'Rohan Gupta',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      title: 'Safe travels to Seattle!',
      message: 'So proud of your new journey! Save a couch for us when we visit. We are going to miss your spontaneous weekend road trip plans!',
    },
    {
      authorName: 'Karan Mehta',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      title: 'The Hackathon partner',
      message: 'Karan here! Rahul and Aditya pulled a 36-hour coding marathon with zero sleep. That trophy in 2021 remains our peak college achievement.',
    },
    {
      authorName: 'Neha Verma',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      title: 'Sister\'s Note',
      message: 'Proud sister here! Watching Rahul build lifelong friendships with Aditya, Karan, and Priya makes my heart full. Best of luck in your new chapter!',
    },
    {
      authorName: 'Prof. S. R. Kulkarni',
      authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      title: 'Faculty Mentor Note',
      message: 'Rahul was an outstanding student and team leader in the Innovation Lab. Wishing him immense success in higher studies.',
    },
    {
      authorName: 'Ananya Roy',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      title: 'Cultural Fest Coordinator',
      message: 'Rahul\'s acoustic guitar performance at the 2022 fest still gives me chills. Keep playing music wherever you go!',
    },
    {
      authorId: aditya.id,
      authorName: 'Aditya Sharma',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      title: 'Until we meet again',
      message: 'Created this MemoryVault space so all our hostel memories, farewell photos, and college notes live forever. See you soon in Seattle!',
    },
  ];

  for (const item of messagesData) {
    const msg = await prisma.memoryMessage.create({
      data: {
        memorySpaceId: rahulSpace.id,
        ...item,
      },
    });

    await EmbeddingService.indexMemoryContent(
      rahulSpace.id,
      'MESSAGE',
      msg.id,
      `${msg.authorName} ${msg.title || ''} ${msg.message}`
    );
  }

  console.log(`💌 Seeded 8 Messages & Embeddings`);

  // 6. Seed 6 Timeline Events
  const timelineData = [
    {
      title: 'First Meeting at Hostel Check-in',
      description: 'Met in Room 304 while trying to fix the ceiling fan. Ended up talking for 3 hours straight.',
      date: '2019-07-22',
    },
    {
      title: 'First College Road Trip to Lonavala',
      description: 'Spontaneous rainy day drive with canteen gang.',
      date: '2020-09-15',
    },
    {
      title: 'Won 1st Prize in National Hackathon',
      description: 'Built an IoT prototype in 36 hours non-stop with Karan and Aditya.',
      date: '2021-11-12',
    },
    {
      title: 'College Graduation & Award Ceremony',
      description: 'Walked the stage, tossed hats in the air, and promised to keep in touch every month.',
      date: '2023-05-18',
    },
    {
      title: 'Manali Farewell Reunion Trip',
      description: 'The final trip together before Rahul relocated for his master\'s degree.',
      date: '2026-02-10',
    },
    {
      title: 'Farewell at Airport T2',
      description: 'Seeing Rahul off at the departure gate. MemoryVault space created to keep all memories alive forever.',
      date: '2026-09-01',
    },
  ];

  for (const item of timelineData) {
    const evt = await prisma.timelineEvent.create({
      data: {
        memorySpaceId: rahulSpace.id,
        ...item,
      },
    });

    await EmbeddingService.indexMemoryContent(
      rahulSpace.id,
      'TIMELINE',
      evt.id,
      `${evt.title} ${evt.description} ${evt.date}`
    );
  }

  console.log(`🕰️ Seeded 6 Timeline Events & Embeddings`);

  // 7. Seed Contributors & AI Tags
  await prisma.contributor.createMany({
    data: [
      { memorySpaceId: rahulSpace.id, userId: aditya.id, role: 'OWNER' },
      { memorySpaceId: rahulSpace.id, userId: priya.id, role: 'CONTRIBUTOR' },
      { memorySpaceId: rahulSpace.id, userId: rohan.id, role: 'CONTRIBUTOR' },
    ],
  });

  const tagsList = ['College', 'Friendship', 'Travel', 'Farewell', 'Celebration', 'Achievement', 'Funny Moments'];
  for (const tag of tagsList) {
    await prisma.memoryTag.create({
      data: {
        memorySpaceId: rahulSpace.id,
        tag,
        source: 'AI',
      },
    });
  }

  // 8. Seed Default AI Settings
  await prisma.aISettings.create({
    data: {
      memorySpaceId: rahulSpace.id,
      enableSearch: true,
      enableDescriptions: true,
      enableTimeline: true,
      enableStory: true,
      enableAssistant: true,
    },
  });

  console.log('✅ Phase 2 Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
