-- 种子数据脚本
-- 插入测试用户和图片数据

-- 清理现有数据（如果需要重新初始化）
-- TRUNCATE TABLE downloads, search_logs, images, users RESTART IDENTITY CASCADE;

-- 插入测试用户
INSERT INTO users (id, email, created_at) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'user1@test.com', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'user2@test.com', NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'user3@test.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入测试图片数据
-- 注意：这些图片需要先在COS中实际存在
INSERT INTO images (
  id, user_id, cos_key, status, width, height, file_size,
  camera_make, camera_model, taken_at, likes, downloads, created_at
) VALUES
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'images/seed/landscape-1.jpg',
    'approved',
    1920, 1280, 2048000,
    'Canon', 'EOS R5',
    '2024-01-15 10:30:00',
    128, 45,
    NOW() - INTERVAL '2 days'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'images/seed/portrait-1.jpg',
    'approved',
    1280, 1920, 1536000,
    'Sony', 'A7R IV',
    '2024-01-16 14:20:00',
    256, 78,
    NOW() - INTERVAL '1 day'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'images/seed/nature-1.jpg',
    'approved',
    2048, 1365, 3072000,
    'Nikon', 'D850',
    '2024-01-17 08:15:00',
    89, 32,
    NOW() - INTERVAL '12 hours'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'images/seed/city-1.jpg',
    'approved',
    1920, 1080, 1843200,
    'Fujifilm', 'X-T4',
    '2024-01-18 19:45:00',
    167, 56,
    NOW() - INTERVAL '6 hours'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'images/seed/abstract-1.jpg',
    'approved',
    1600, 1600, 1280000,
    'Canon', 'EOS 5D Mark IV',
    '2024-01-19 11:00:00',
    203, 67,
    NOW() - INTERVAL '3 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- 插入下载记录
INSERT INTO downloads (id, image_id, user_id, size, created_at) VALUES
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'medium', NOW() - INTERVAL '1 day'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'original', NOW() - INTERVAL '12 hours'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'small', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;
