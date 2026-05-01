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

const BASE_URL = 'http://localhost:5000';

const API = {
    /**
     * GET: Retrieves data from the server.
     * Includes "virtual" joining to attach profile pictures to posts and reports.
     */
    get: async (url) => {
        // --- VIRTUAL ROUTE: ADMIN PENDING POSTS ---
        if (url === '/admin/pending') {
            const [pRes, uRes] = await Promise.all([fetch('/posts'), fetch('/users')]);
            const posts = await pRes.json();
            const users = await uRes.json();
            
            const enriched = posts
                .filter(p => p.status === 'PENDING')
                .map(p => {
                    const author = users.find(u => u.id == p.user_id || u.username === p.username);
                    return { ...p, profile_picture: author?.profile_picture };
                });
            return { data: enriched };
        }

        // --- VIRTUAL ROUTE: USER'S OWN POSTS ---
        if (url === '/posts/user') {
            const userData = JSON.parse(localStorage.getItem('postpal_user'));
            if (!userData) return { data: [] };
            
            const [pRes, uRes] = await Promise.all([fetch('/posts'), fetch('/users')]);
            const posts = await pRes.json();
            const users = await uRes.json();
            
            const enriched = posts
                .filter(p => p.user_id == userData.id || p.username === userData.username)
                .map(p => {
                    const author = users.find(u => u.id == p.user_id || u.username === p.username);
                    return { ...p, profile_picture: author?.profile_picture };
                });
            return { data: enriched };
        }

        // --- VIRTUAL ROUTE: ALL POSTS (WALL) ---
        if (url === '/posts') {
            const [pRes, uRes] = await Promise.all([fetch('/posts'), fetch('/users')]);
            const posts = await pRes.json();
            const users = await uRes.json();
            
            const enriched = posts.map(p => {
                const author = users.find(u => u.id == p.user_id || u.username === p.username);
                return { ...p, profile_picture: author?.profile_picture };
            });
            return { data: enriched };
        }

        // --- VIRTUAL ROUTE: COMMENTS (with user pictures) ---
        if (url.startsWith('/comments')) {
            const [cRes, uRes] = await Promise.all([fetch(url), fetch('/users')]);
            const comments = await cRes.json();
            const users = await uRes.json();
            
            const enriched = Array.isArray(comments) ? comments.map(c => {
                const author = users.find(u => u.id == c.user_id || u.username === c.username);
                return { ...c, profile_picture: author?.profile_picture };
            }) : comments;
            return { data: enriched };
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
            const cRes = await fetch('/comments');
            const rRes = await fetch('/reports');

            const posts = await pRes.json();
            const users = await uRes.json();
            const comments = await cRes.json();
            const reports = await rRes.json();

            const totals = {
                total_posts: posts.length,
                total_users: users.length,
                total_likes: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
                total_comments: comments.length,
                total_reports: reports.length
            };

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

            const topPosts = [...posts].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 20);

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

        // --- VIRTUAL ROUTE: ADMIN REPORTS ---
        if (url === '/admin/reports') {
            const [rRes, pRes, uRes] = await Promise.all([fetch('/reports'), fetch('/posts'), fetch('/users')]);
            const reports = await rRes.json();
            const posts = await pRes.json();
            const users = await uRes.json();

            const enrichedReports = reports.map(r => {
                const post = posts.find(p => p.id == r.post_id);
                const reporter = users.find(u => u.username === r.reporter_name);
                return {
                    ...r,
                    status: r.status || 'PENDING',
                    reporter_name: r.reporter_name || 'Anonymous User',
                    reporter_picture: reporter?.profile_picture,
                    content: post ? post.content : 'Permanent Record Deleted',
                    topic: post ? post.username : 'Unknown Node'
                };
            });
            return { data: enrichedReports };
        }

        // STANDARD GET
        const res = await fetch(url);
        const data = await res.json();
        return { data }; 
    },

    /**
     * POST: Sends new data to the server.
     */
    post: async (url, data) => {
        if (url.includes('/dismiss') && url.includes('/admin/reports/')) {
            const reportId = url.split('/')[3];
            const response = await fetch(`/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DISMISSED' })
            });
            return { data: await response.json() };
        }

        if (url === '/login') {
            const res = await fetch('/users');
            const users = await res.json();
            const user = users.find(u => u.email === data.email && u.password === data.password);
            
            if (!user) throw new Error("Invalid email or password!");
            if (user.status === 'DEACTIVATED') throw new Error("Account deactivated.");
            
            return { data: { token: "demo-token-" + user.id, user } };
        }

        if (url === '/register') {
            const res = await fetch('/users');
            const users = await res.json();
            if (users.find(u => u.email === data.email)) throw new Error("Email already registered!");

            const newUser = { 
                ...data, 
                role: 'user', 
                created_at: new Date().toISOString(),
                id: Math.random().toString(36).substr(2, 9)
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
        return { data: await response.json() };
    },

    /**
     * PATCH: Updates specific fields.
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
     * PUT: Updates profile or handles standard updates.
     */
    put: async (url, data) => {
        if (url === '/users/profile') {
            const userData = JSON.parse(localStorage.getItem('postpal_user'));
            if (!userData) throw new Error("Session expired.");

            let updateData = {};
            if (data instanceof FormData) {
                updateData.username = data.get('username');
                updateData.email = data.get('email');
                
                const file = data.get('profile_picture');
                if (file && file instanceof File && file.size > 0) {
                    const base64Promise = new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const img = new Image();
                            img.onload = () => {
                                // Create a canvas to resize the image
                                const canvas = document.createElement('canvas');
                                let width = img.width;
                                let height = img.height;

                                // Max dimension of 800px is plenty for a profile pic
                                const MAX_SIZE = 800;
                                if (width > height) {
                                    if (width > MAX_SIZE) {
                                        height *= MAX_SIZE / width;
                                        width = MAX_SIZE;
                                    }
                                } else {
                                    if (height > MAX_SIZE) {
                                        width *= MAX_SIZE / height;
                                        height = MAX_SIZE;
                                    }
                                }

                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0, width, height);

                                // Convert to JPEG with 0.7 quality for great compression
                                resolve(canvas.toDataURL('image/jpeg', 0.7));
                            };
                            img.onerror = reject;
                            img.src = e.target.result;
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                    updateData.profile_picture = await base64Promise;
                }
            } else {
                updateData = data;
            }

            // USE ABSOLUTE URL TO BYPASS PROXY LIMITS
            const response = await fetch(`${BASE_URL}/users/${userData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error (${response.status}): ${errorText || "Check size limits or ID."}`);
            }
            
            const updatedUser = await response.json();
            return { 
                data: { 
                    user: updatedUser, 
                    token: localStorage.getItem('postpal_token') 
                } 
            };
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return { data: await response.json() };
    },

    /**
     * DELETE: Removes a record.
     */
    delete: async (url) => {
        const response = await fetch(url, { method: 'DELETE' });
        return { data: await response.json() };
    }
};

export default API;

