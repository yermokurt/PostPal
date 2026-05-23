-- PostPal SQL Setup Script
-- Paste this script directly into the Supabase Dashboard -> SQL Editor and click "Run".

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    profile_picture TEXT,
    bio TEXT DEFAULT '',
    gender TEXT,
    age TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    image TEXT,
    liked_by JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
    reporter_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 7. Add Public CRUD Policies (Allows serverless client-side operations via Anon Key)
CREATE POLICY "Allow public read" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON users FOR DELETE USING (true);

CREATE POLICY "Allow public read" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON posts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON posts FOR DELETE USING (true);

CREATE POLICY "Allow public read" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON comments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON comments FOR DELETE USING (true);

CREATE POLICY "Allow public read" ON reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON reports FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON reports FOR DELETE USING (true);

-- 8. Seed Default Admin User
-- Email: admin@postpal.com
-- Password: admin123
-- Role: admin
INSERT INTO users (id, username, email, password, role, status, bio)
VALUES (
    '99',
    'AdminMaster',
    'admin@postpal.com',
    'admin123',
    'admin',
    'ACTIVE',
    'System Administrator'
) ON CONFLICT (id) DO NOTHING;

-- 9. Optional: Seed default test user (test@gmail.com / test1234)
INSERT INTO users (id, username, email, password, role, status, bio)
VALUES (
    'oEy0NyQtJU0',
    'test1',
    'test@gmail.com',
    'test1234',
    'user',
    'ACTIVE',
    'Regular student user account for testing.'
) ON CONFLICT (id) DO NOTHING;
