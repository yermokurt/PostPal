// src/api/json.js — Standard Fetch API Helper
// This file talks to your "npm run api" server. 
// It uses browser-native fetch() and handles JSON automatically.

const API = {
    // 1. GET: Retrieves data from storage.json
    get: async (url) => {
        // --- ADMIN PENDING POSTS ---
        if (url === '/admin/pending') {
            const res = await fetch('/posts');
            const posts = await res.json();
            return { data: posts.filter(p => p.status === 'PENDING') };
        }

        // --- ADMIN STATS ---
        if (url === '/admin/stats') {
            const pRes = await fetch('/posts');
            const uRes = await fetch('/users');
            const posts = await pRes.json();
            const users = await uRes.json();
            return { data: {
                total_posts: posts.length,
                total_users: users.length,
                pending_posts: posts.filter(p => p.status === 'PENDING').length
            }};
        }

        // --- ADMIN REPORT DATA ---
        if (url === '/admin/report/data') {
            const pRes = await fetch('/posts');
            const uRes = await fetch('/users');
            const posts = await pRes.json();
            const users = await uRes.json();

            // Calculate Totals
            const totals = {
                total_posts: posts.length,
                total_users: users.length,
                total_likes: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
                total_comments: 0, 
                total_reports: 0
            };

            // Calculate User Stats
            const userStats = users.map(u => ({
                ...u,
                total_posts: posts.filter(p => p.username === u.username).length,
                total_likes: posts.filter(p => p.username === u.username).reduce((sum, p) => sum + (p.likes_count || 0), 0)
            }));

            // Calculate Trending Topics
            const topics = [...new Set(posts.map(p => p.topic))].map(topic => ({
                topic,
                total_posts: posts.filter(p => p.topic === topic).length,
                total_likes: posts.filter(p => p.topic === topic).reduce((sum, p) => sum + (p.likes_count || 0), 0)
            }));

            return { data: { 
                totals, 
                users: userStats, 
                trendingTopics: topics.slice(0, 5),
                topPosts: [...posts].sort((a,b) => b.likes_count - a.likes_count).slice(0, 10),
                generatedAt: new Date().toISOString()
            }};
        }

        const res = await fetch(url);
        const data = await res.json();
        return { data: Array.isArray(data) ? data : [] }; 
    },

    // 2. POST: Creates new records (Login, Registers, or new Posts)
    post: async (url, data) => {
        // --- LOGIN LOGIC ---
        if (url === '/login') {
            const res = await fetch('/users');
            const users = await res.json();
            const user = users.find(u => u.email === data.email && u.password === data.password);
            if (!user) throw new Error("Invalid email or password!");
            return { data: { token: "demo-token-" + user.id, user } };
        }

        // --- REGISTER LOGIC ---
        if (url === '/register') {
            const res = await fetch('/users');
            const users = await res.json();
            
            // Check if email already exists
            if (users.find(u => u.email === data.email)) {
                throw new Error("Email is already registered!");
            }

            // Create the new user in storage.json
            const newUser = { 
                ...data, 
                role: 'user', 
                created_at: new Date().toISOString(),
                id: Date.now().toString() 
            };
            const response = await fetch('/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            return { data: await response.json() };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return { data: result };
    },

    // 3. PATCH: Updates a single field (like adding a Like)
    patch: async (url, data) => {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return { data: result };
    },

    // 4. DELETE: Removes a record (for comments/reports)
    delete: async (url) => {
        const response = await fetch(url, { method: 'DELETE' });
        return { data: await response.json() };
    }
};

export default API;
