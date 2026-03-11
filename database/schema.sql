-- PostgreSQL Schema for Image Library MVP
-- Tables: users, images, downloads

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Status enum for images
CREATE TYPE image_status AS ENUM ('pending', 'approved', 'rejected');

-- Download size enum
CREATE TYPE download_size AS ENUM ('small', 'medium', 'original');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    cos_key VARCHAR(500) NOT NULL,
    exif_data JSONB,
    status image_status DEFAULT 'pending',
    width INTEGER,
    height INTEGER,
    file_size INTEGER, -- in bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_images_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Downloads table
CREATE TABLE IF NOT EXISTS downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID NOT NULL,
    user_id UUID NOT NULL,
    size download_size,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_downloads_image
        FOREIGN KEY (image_id) 
        REFERENCES images(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_downloads_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_status ON images(status);
CREATE INDEX idx_images_created_at ON images(created_at DESC);
CREATE INDEX idx_downloads_image_id ON downloads(image_id);
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_created_at ON downloads(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE users IS 'Registered users with phone authentication';
COMMENT ON TABLE images IS 'Image metadata uploaded by users, stored in COS';
COMMENT ON TABLE downloads IS 'Download history tracking';
COMMENT ON COLUMN images.cos_key IS 'Cloud Object Storage key/path to the actual image file';
COMMENT ON COLUMN images.exif_data IS 'EXIF metadata extracted from the image file';
