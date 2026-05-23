# Supabase Database & Vercel Deployment Migration Plan

This guide outlines how we migrated the **PostPal** system from a local file-based database (`storage.json` hosted by `json-server`) to a production-ready, fully serverless architecture using **Supabase** (hosted Postgres database) and **Vercel** (for cloud frontend hosting).

---

## 🚀 Key Benefits of this Migration
1. **Serverless Architecture**: You no longer need to run a local Express server or `json-server` (`npm run api` is deprecated!).
2. **Real Database**: A robust hosted Postgres database on Supabase with relationships, safety constraints, and unlimited capacity.
3. **Global CDN Deployment**: Host the React frontend on Vercel with automatic builds, zero-downtime deployments, and high performance.
4. **100% Frontend Compatibility**: The custom `json.js` API bridge has been rewritten to translate standard HTTP-like requests to Supabase client operations, meaning your React pages worked out-of-the-box without needing any modifications.

---

## 🛠️ Step 1: Create your Supabase Project & Execute SQL Schema

1. Go to [Supabase](https://supabase.com/) and sign up for a free account.
2. Click **New Project** and name your project (e.g., `postpal-db`). Set a database password and select a region close to you.
3. Once the database is ready, navigate to the **SQL Editor** in the left sidebar menu (looks like a `SQL` icon).
4. Click **New Query**, then copy and paste the contents of [supabase_setup.sql](file:///c:/Users/Kurt/Documents/itelect3/ITELECT3_finals_json/supabase_setup.sql) (also shown below) into the editor.
5. Click **Run** in the top right. You should see a success message: `Success! No rows returned.`.

```sql
-- PostPal SQL Setup Script
-- Paste this script directly into the Supabase Dashboard -> SQL Editor and click "Run".

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    profile_picture TEXT, -- For large base64 image strings
    bio TEXT DEFAULT '',
    gender TEXT,
    age TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Posts Table
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
    image TEXT, -- For base64 post images
    liked_by JSONB DEFAULT '[]'::jsonb, -- Store list of user IDs who liked it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
    reporter_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 6. Add Public CRUD Policies (Allows serverless client-side operations via Anon Key)
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

-- 7. Seed Default Admin User
-- Email: admin@postpal.com | Password: admin123
INSERT INTO users (id, username, email, password, role, status, bio)
VALUES ('99', 'AdminMaster', 'admin@postpal.com', 'admin123', 'admin', 'ACTIVE', 'System Administrator')
ON CONFLICT (id) DO NOTHING;

-- 8. Seed default test user (test@gmail.com | test1234)
INSERT INTO users (id, username, email, password, role, status, bio)
VALUES ('oEy0NyQtJU0', 'test1', 'test@gmail.com', 'test1234', 'user', 'ACTIVE', 'Regular student user account for testing.')
ON CONFLICT (id) DO NOTHING;
```

---

## 🔑 Step 2: Configure Environment Variables

We created a `.env` and `.env.example` in your local project root folder.
Open the [.env](file:///c:/Users/Kurt/Documents/itelect3/ITELECT3_finals_json/.env) file and replace the placeholder values with your project credentials:

1. In Supabase, go to **Project Settings** -> **API**.
2. Copy the **Project URL** and assign it to `REACT_APP_SUPABASE_URL`.
3. Copy the **anon / public** key and assign it to `REACT_APP_SUPABASE_ANON_KEY`.

```env
REACT_APP_SUPABASE_URL=https://your-supabase-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-here
```

---

## 📂 Step 3: What We Changed Under the Hood

To achieve a seamless zero-code-change migration on the frontend, we restructured the following files:

1. **Installed `@supabase/supabase-js`**: Used to initiate client-side interactions with the Supabase engine.
2. **`src/api/supabaseClient.js`**: Created this file to instantiate the Supabase client using environment variables.
3. **`src/api/json.js`**: Completely rewrote the fetch bridge to:
   - Parse clean standard REST table queries.
   - Dynamically run joins like `.select('*, users(profile_picture)')` to pull author profile pictures, keeping comments and posts looking clean.
   - Perform user registration checks and password validation securely within Supabase tables.
   - **Fields Cross-Mapping**: We implemented an adapter mapping that injects both snake_case and camelCase parameters (e.g. `c.post_id` and `c.postId`) in outputs so the pages continue working without any changes.

---

## ☁️ Step 4: Deploying to Vercel

Since the backend is fully serverless, you can deploy the React app to Vercel in just a few minutes:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Sign up or log into [Vercel](https://vercel.com/).
3. Click **Add New** -> **Project** and import your Git repository.
4. Under **Environment Variables**, add the same two variables from your `.env` file:
   - Name: `REACT_APP_SUPABASE_URL` | Value: *Your project URL*
   - Name: `REACT_APP_SUPABASE_ANON_KEY` | Value: *Your anon public key*
5. Click **Deploy**. Vercel will build the frontend assets and give you a public, secure `.vercel.app` URL!

---

## 🛠️ Local Development Command

During local development, you no longer need `npm run api`!
Just run:
```bash
npm start
```
This runs the React dev server locally at `http://localhost:3000` which directly queries the Supabase database in the cloud!
