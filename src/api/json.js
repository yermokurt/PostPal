/**
 * PostPal API Helper (json.js)
 * 
 * HOW THIS WORKS:
 * 1. This file acts as a "bridge" between the React frontend and the JSON database (storage.json).
 * 2. It uses the browser's built-in fetch() function to send requests to http://localhost:5000.
 * 3. We use async/await to make the code look like a simple list of steps, making it easier to read.
 * 
 * CATEGORIES:
 * - GET: Used to READ data (like loading the feed).
 * - POST: Used to CREATE data (like registration or posting).
 * - PATCH: Used to UPDATE specific parts of data (like adding a +1 to likes).
 * - DELETE: Used to REMOVE data (like deleting a report or comment).
 */

const API = {
    /**
     * GET: Retrieves data from the server.
     * Some URLs are "virtual" and we combine data manually to make it easier for the UI.
     */
    get: async (url) => {
        // --- VIRTUAL ROUTE: ADMIN PENDING POSTS ---
        if (url === '/admin/pending') {
            const res = await fetch('/posts');
            const posts = await res.json();
            // We only return posts that are waiting for approval
            return { data: posts.filter(p => p.status === 'PENDING') };
        }

        // --- VIRTUAL ROUTE: USER'S OWN POSTS (for Profile History) ---
        if (url === '/posts/user') {
            const userData = JSON.parse(localStorage.getItem('postpal_user'));
            if (!userData) return { data: [] };
            
            const res = await fetch('/posts');
            const posts = await res.json();
            // Filter posts that belong to this specific user
            // We use == instead of === because IDs might be string or number
            return { data: posts.filter(p => p.user_id == userData.id || p.username === userData.username) };
        }

        // --- VIRTUAL ROUTE: ADMIN DASHBOARD STATS ---
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

        // --- VIRTUAL ROUTE: GENERATE ANALYTICS REPORT ---
        if (url === '/admin/report/data') {
            const pRes = await fetch('/posts');
            const uRes = await fetch('/users');
            const cRes = await fetch('/comments'); // Also need comments for full report
            const rRes = await fetch('/reports');

            const posts = await pRes.json();
            const users = await uRes.json();
            const comments = await cRes.json();
            const reports = await rRes.json();

            // Calculate totals
            const totals = {
                total_posts: posts.length,
                total_users: users.length,
                total_likes: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
                total_comments: comments.length,
                total_reports: reports.length
            };

            // Calculate user performance
            const userStats = users.map(user => {
                const uposts = posts.filter(p => p.user_id == user.id || p.username === user.username);
                return {
                    ...user,
                    total_posts: uposts.length,
                    total_likes: uposts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
                    approved_posts: uposts.filter(p => p.status === 'APPROVED').length,
                    pending_posts: uposts.filter(p => p.status === 'PENDING').length,
                    rejected_posts: uposts.filter(p => p.status === 'REJECTED').length
                };
            });

            // Calculate top performing posts
            const topPosts = [...posts].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 20);

            // Calculate trending topics
            const topics = {};
            posts.forEach(p => {
                if (!topics[p.topic]) topics[p.topic] = { topic: p.topic, total_posts: 0, total_likes: 0, total_comments: 0 };
                topics[p.topic].total_posts++;
                topics[p.topic].total_likes += (p.likes_count || 0);
            });
            const trendingTopics = Object.values(topics).sort((a, b) => b.total_posts - a.total_posts);

            return { data: { 
                totals, 
                users: userStats,
                topPosts,
                trendingTopics,
                generatedAt: new Date().toISOString()
            }};
        }

        // --- VIRTUAL ROUTE: ADMIN REPORTS (Joined with post data) ---
        if (url === '/admin/reports') {
            const rRes = await fetch('/reports');
            const pRes = await fetch('/posts');
            const reports = await rRes.json();
            const posts = await pRes.json();

            // Join each report with its post content so the admin knows what was reported
            const enrichedReports = reports.map(r => {
                const post = posts.find(p => p.id == r.post_id);
                return {
                    ...r,
                    status: r.status || 'PENDING',
                    reporter_name: r.reporter_name || 'Anonymous User',
                    // Fields expected by ReportsPage UI:
                    content: post ? post.content : 'Permanent Record Deleted',
                    topic: post ? post.username : 'Unknown Node'
                };
            });
            return { data: enrichedReports };
        }

        // STANDARD GET: Just fetch the URL provided
        const res = await fetch(url);
        const data = await res.json();
        return { data: Array.isArray(data) ? data : data }; 
    },

    /**
     * POST: Sends new data to the server to be saved.
     */
    post: async (url, data) => {
        // --- VIRTUAL ROUTE: DISMISS REPORT ---
        if (url.includes('/dismiss') && url.includes('/admin/reports/')) {
            const reportId = url.split('/')[3];
            // We use PATCH to update the status in the real reports table
            const response = await fetch(`/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DISMISSED' })
            });
            const updated = await response.json();
            return { data: updated };
        }

        // --- VIRTUAL ROUTE: LOGIN ---
        if (url === '/login') {
            const res = await fetch('/users');
            const users = await res.json();
            // Check if email and password match any user in our list
            const user = users.find(u => u.email === data.email && u.password === data.password);
            
            if (!user) {
                throw new Error("Invalid email or password! Please check your credentials.");
            }

            if (user.status === 'DEACTIVATED') {
                throw new Error("Your account has been deactivated by an administrator. Please contact support.");
            }
            
            // Return a fake "token" and the user data
            return { data: { token: "demo-token-" + user.id, user } };
        }

        // --- VIRTUAL ROUTE: REGISTER ---
        if (url === '/register') {
            const res = await fetch('/users');
            const users = await res.json();
            
            // Prevent duplicate emails
            if (users.find(u => u.email === data.email)) {
                throw new Error("Email is already registered! Please use a different one.");
            }

            // Setup new user object
            const newUser = { 
                ...data, 
                role: 'user', 
                created_at: new Date().toISOString(),
                id: Math.random().toString(36).substr(2, 9) // Generate a random ID
            };

            const response = await fetch('/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            return { data: await response.json() };
        }

        // STANDARD POST: Create a new record in whatever table is requested
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return { data: await response.json() };
    },

    /**
     * PATCH: Updates only specific fields of an existing record.
     */
    patch: async (url, data) => {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return { data: await response.json() };
    },

    /**
     * DELETE: Removes a record forever.
     */
    delete: async (url) => {
        // Note: json-server expects DELETE /resource/id
        const response = await fetch(url, { method: 'DELETE' });
        return { data: await response.json() };
    }
};

export default API;

