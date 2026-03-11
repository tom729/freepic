import { db } from '../lib/db';
import { users, images } from '../lib/schema';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create test users
  const user1Id = uuidv4();
  const user2Id = uuidv4();
  const user3Id = uuidv4();

  await db.insert(users).values([
    {
      id: user1Id,
      email: 'user1@test.com',
      createdAt: new Date(),
    },
    {
      id: user2Id,
      email: 'user2@test.com',
      createdAt: new Date(),
    },
    {
      id: user3Id,
      email: 'user3@test.com',
      createdAt: new Date(),
    },
  ]);

  console.log('✅ Created 3 test users');

  // Create test images
  await db.insert(images).values([
    {
      id: uuidv4(),
      userId: user1Id,
      cosKey: 'images/mock/landscape-1.jpg',
      exifData: {
        cameraMake: 'Sony',
        cameraModel: 'A7R IV',
        dateTaken: '2024-01-15',
        iso: '100',
        aperture: 'f/2.8',
        shutterSpeed: '1/250s',
      },
      status: 'approved',
      width: 1920,
      height: 1280,
      fileSize: 1024000,
      likes: 128,
      downloads: 45,
      createdAt: new Date('2024-02-20T10:30:00Z'),
    },
    {
      id: uuidv4(),
      userId: user2Id,
      cosKey: 'images/mock/portrait-1.jpg',
      exifData: {
        cameraMake: 'Canon',
        cameraModel: 'EOS R5',
        dateTaken: '2024-01-14',
        iso: '200',
        aperture: 'f/4',
        shutterSpeed: '1/500s',
      },
      status: 'approved',
      width: 1280,
      height: 1920,
      fileSize: 2048000,
      likes: 256,
      downloads: 78,
      createdAt: new Date('2024-02-21T14:20:00Z'),
    },
    {
      id: uuidv4(),
      userId: user3Id,
      cosKey: 'images/mock/nature-1.jpg',
      exifData: {
        cameraMake: 'Nikon',
        cameraModel: 'Z9',
        dateTaken: '2024-01-13',
      },
      status: 'approved',
      width: 2048,
      height: 1365,
      fileSize: 1536000,
      likes: 89,
      downloads: 32,
      createdAt: new Date('2024-02-22T08:15:00Z'),
    },
    {
      id: uuidv4(),
      userId: user1Id,
      cosKey: 'images/mock/city-1.jpg',
      exifData: {
        cameraMake: 'Fujifilm',
        cameraModel: 'X-T5',
        dateTaken: '2024-01-12',
      },
      status: 'approved',
      width: 1920,
      height: 1080,
      fileSize: 1800000,
      likes: 167,
      downloads: 56,
      createdAt: new Date('2024-02-23T19:45:00Z'),
    },
    {
      id: uuidv4(),
      userId: user2Id,
      cosKey: 'images/mock/abstract-1.jpg',
      exifData: {
        cameraMake: 'Leica',
        cameraModel: 'Q2',
        dateTaken: '2024-01-11',
      },
      status: 'approved',
      width: 1600,
      height: 1600,
      fileSize: 1200000,
      likes: 203,
      downloads: 67,
      createdAt: new Date('2024-02-24T11:00:00Z'),
    },
    {
      id: uuidv4(),
      userId: user3Id,
      cosKey: 'images/mock/food-1.jpg',
      exifData: {
        cameraMake: 'Sony',
        cameraModel: 'A7 III',
        dateTaken: '2024-01-10',
      },
      status: 'approved',
      width: 1920,
      height: 1920,
      fileSize: 2200000,
      likes: 342,
      downloads: 89,
      createdAt: new Date('2024-02-25T15:30:00Z'),
    },
    {
      id: uuidv4(),
      userId: user1Id,
      cosKey: 'images/mock/tech-1.jpg',
      exifData: {
        cameraMake: 'Canon',
        cameraModel: 'EOS R6',
        dateTaken: '2024-01-09',
      },
      status: 'approved',
      width: 1920,
      height: 1280,
      fileSize: 1600000,
      likes: 89,
      downloads: 23,
      createdAt: new Date('2024-02-26T09:00:00Z'),
    },
    {
      id: uuidv4(),
      userId: user2Id,
      cosKey: 'images/mock/animal-1.jpg',
      exifData: {
        cameraMake: 'Nikon',
        cameraModel: 'D850',
        dateTaken: '2024-01-08',
      },
      status: 'approved',
      width: 1280,
      height: 853,
      fileSize: 1400000,
      likes: 456,
      downloads: 123,
      createdAt: new Date('2024-02-27T16:20:00Z'),
    },
  ]);

  console.log('✅ Created 8 test images');
  console.log('🎉 Database seeded successfully!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
