/**
 * PostPal API Helper (Supabase Edition)
 * 
 * HOW THIS WORKS:
 * 1. This file acts as a "bridge" between the React frontend and the hosted Supabase database.
 * 2. We keep the exact same interface (API.get, API.post, API.patch, API.put, API.delete)
 *    so we don't have to change a single line of page code in the frontend!
 * 3. We map camelCase fields (used by frontend) to snake_case (used by Postgres) and back, 
 *    returning dual-mapped objects so that both c.postId and c.post_id work flawlessly.
 */

import { supabase } from './supabaseClient';

/**
 * Parses clean REST table name, ID, and query parameters from API URLs.
 * e.g., "/users/99?test=1" -> { tableName: "users", id: "99", params: { test: "1" } }
 */
function parseRESTUrl(url) {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const [pathPart, queryPart] = cleanUrl.split('?');
    const parts = pathPart.split('/');
    const tableName = parts[0];
    const id = parts[1];

    const params = {};
    if (queryPart) {
        const urlParams = new URLSearchParams(queryPart);
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
    }

    return { tableName, id, params };
}

/**
 * Maps frontend camelCase field names to database snake_case field names.
 */
function mapFieldsToDb(data) {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(mapFieldsToDb);
    
    const mapped = {};
    for (const [key, val] of Object.entries(data)) {
        let dbKey = key;
        if (key === 'postId') dbKey = 'post_id';
        if (key === 'userId') dbKey = 'user_id';
        if (key === 'likesCount') dbKey = 'likes_count';
        if (key === 'commentCount') dbKey = 'comment_count';
        if (key === 'isAnonymous') dbKey = 'is_anonymous';
        if (key === 'profilePicture') dbKey = 'profile_picture';
        
        mapped[dbKey] = val;
    }
    return mapped;
}

/**
 * Returns a dual-mapped object supporting both camelCase and snake_case properties
 * to guarantee complete safety for all existing frontend queries.
 */
function mapFieldsToFrontend(data) {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(mapFieldsToFrontend);
    if (typeof data !== 'object') return data;

    const mapped = { ...data };

    if ('post_id' in data) mapped.postId = data.post_id;
    if ('postId' in data) mapped.post_id = data.postId;

    if ('user_id' in data) mapped.userId = data.user_id;
    if ('userId' in data) mapped.user_id = data.userId;

    if ('likes_count' in data) mapped.likesCount = data.likes_count;
    if ('likesCount' in data) mapped.likes_count = data.likesCount;

    if ('comment_count' in data) mapped.commentCount = data.comment_count;
    if ('commentCount' in data) mapped.comment_count = data.commentCount;

    if ('is_anonymous' in data) mapped.isAnonymous = data.is_anonymous;
    if ('isAnonymous' in data) mapped.is_anonymous = data.isAnonymous;

    if ('profile_picture' in data) mapped.profilePicture = data.profile_picture;
    if ('profilePicture' in data) mapped.profile_picture = data.profilePicture;

    return mapped;
}

const API = {
    /**
     * GET: Retrieves data from Supabase.
     * Incorporates nested joins to fetch author profile pictures dynamically.
     */
    get: async (url) => {
        // --- VIRTUAL ROUTE: ADMIN PENDING POSTS ---
        if (url === '/admin/pending') {
            const { data: posts, error } = await supabase
                .from('posts')
                .select('*, users(profile_picture)')
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const enriched = posts ? posts.map(p => ({
                ...p,
                profile_picture: p.users?.profile_picture
            })) : [];

            return { data: mapFieldsToFrontend(enriched) };
        }

        // --- VIRTUAL ROUTE: USER'S OWN POSTS ---
        if (url === '/posts/user') {
            const userData = JSON.parse(localStorage.getItem('postpal_user'));
            if (!userData) return { data: [] };

            const { data: posts, error } = await supabase
                .from('posts')
                .select('*, users(profile_picture)')
                .or(`user_id.eq.${userData.id},username.eq.${userData.username}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const enriched = posts ? posts.map(p => ({
                ...p,
                profile_picture: p.users?.profile_picture
            })) : [];

            return { data: mapFieldsToFrontend(enriched) };
        }

        // --- VIRTUAL ROUTE: ALL POSTS (WALL) ---
        if (url === '/posts') {
            const { data: posts, error } = await supabase
                .from('posts')
                .select('*, users(profile_picture)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const enriched = posts ? posts.map(p => ({
                ...p,
                profile_picture: p.users?.profile_picture
            })) : [];

            return { data: mapFieldsToFrontend(enriched) };
        }

        // --- VIRTUAL ROUTE: COMMENTS (with user pictures) ---
        if (url.startsWith('/comments')) {
            const { params } = parseRESTUrl(url);
            const postId = params.postId || params.post_id;

            let query = supabase.from('comments').select('*, users(profile_picture)');
            if (postId) {
                query = query.eq('post_id', postId);
            }

            const { data: comments, error } = await query.order('created_at', { ascending: true });
            if (error) throw error;

            const enriched = comments ? comments.map(c => ({
                ...c,
                profile_picture: c.users?.profile_picture
            })) : [];

            return { data: mapFieldsToFrontend(enriched) };
        }

        // --- VIRTUAL ROUTE: ADMIN DASHBOARD STATS ---
        if (url === '/admin/stats') {
            const [pCount, uCount, pendingCount, rCount] = await Promise.all([
                supabase.from('posts').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
                supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'PENDING')
            ]);

            return {
                data: {
                    total_posts: pCount.count || 0,
                    total_users: uCount.count || 0,
                    pending_posts: pendingCount.count || 0,
                    total_reports: rCount.count || 0
                }
            };
        }

        // --- VIRTUAL ROUTE: GENERATE ANALYTICS REPORT ---
        if (url === '/admin/report/data') {
            const [pRes, uRes, cRes, rRes] = await Promise.all([
                supabase.from('posts').select('*'),
                supabase.from('users').select('*'),
                supabase.from('comments').select('*'),
                supabase.from('reports').select('*')
            ]);

            const posts = pRes.data || [];
            const users = uRes.data || [];
            const comments = cRes.data || [];
            const reports = rRes.data || [];

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
                users: mapFieldsToFrontend(userStats),
                topPosts: mapFieldsToFrontend(topPosts),
                trendingTopics,
                generatedAt: new Date().toISOString()
            }};
        }

        // --- VIRTUAL ROUTE: ADMIN REPORTS ---
        if (url === '/admin/reports') {
            const [rRes, pRes, uRes] = await Promise.all([
                supabase.from('reports').select('*'),
                supabase.from('posts').select('*'),
                supabase.from('users').select('*')
            ]);

            const reports = rRes.data || [];
            const posts = pRes.data || [];
            const users = uRes.data || [];

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

            return { data: mapFieldsToFrontend(enrichedReports) };
        }

        // --- STANDARD GET ---
        const { tableName, id, params } = parseRESTUrl(url);
        if (!tableName) throw new Error("Could not parse table name from URL: " + url);

        let query = supabase.from(tableName).select('*');
        if (id) {
            query = query.eq('id', id);
            const { data, error } = await query.single();
            if (error) throw error;
            return { data: mapFieldsToFrontend(data) };
        } else {
            for (const [key, val] of Object.entries(params)) {
                let dbKey = key;
                if (key === 'postId') dbKey = 'post_id';
                if (key === 'userId') dbKey = 'user_id';
                query = query.eq(dbKey, val);
            }
            const { data, error } = await query;
            if (error) throw error;
            return { data: mapFieldsToFrontend(data) };
        }
    },

    /**
     * POST: Sends new data to Supabase.
     */
    post: async (url, data) => {
        // --- VIRTUAL ROUTE: REPORT DISMISSAL ---
        if (url.includes('/dismiss') && url.includes('/admin/reports/')) {
            const reportId = url.split('/')[3];
            const { data: updatedReport, error } = await supabase
                .from('reports')
                .update({ status: 'DISMISSED' })
                .eq('id', reportId)
                .select();

            if (error) throw error;
            return { data: mapFieldsToFrontend(updatedReport && updatedReport[0]) };
        }

        // --- VIRTUAL ROUTE: LOGIN ---
        if (url === '/login') {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', data.email)
                .eq('password', data.password);

            if (error || !users || users.length === 0) {
                throw new Error("Invalid email or password!");
            }
            
            const user = users[0];
            if (user.status === 'DEACTIVATED') throw new Error("Account deactivated.");

            return { data: { token: "demo-token-" + user.id, user: mapFieldsToFrontend(user) } };
        }

        // --- VIRTUAL ROUTE: REGISTER ---
        if (url === '/register') {
            const { data: existing, error: checkError } = await supabase
                .from('users')
                .select('email')
                .eq('email', data.email);

            if (existing && existing.length > 0) {
                throw new Error("Email already registered!");
            }

            const newId = Math.random().toString(36).substr(2, 9);
            const newUser = mapFieldsToDb({
                ...data,
                role: 'user',
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                id: data.id || newId
            });

            const { data: inserted, error: insertError } = await supabase
                .from('users')
                .insert(newUser)
                .select()
                .single();

            if (insertError) throw insertError;
            return { data: mapFieldsToFrontend(inserted) };
        }

        // --- STANDARD POST ---
        const { tableName } = parseRESTUrl(url);
        const newId = Math.random().toString(36).substr(2, 9);

        // Make sure list arrays like 'liked_by' are correctly stored as JSONB arrays
        let finalData = { ...data };
        if (tableName === 'posts' && !finalData.liked_by) {
            finalData.liked_by = [];
        }

        const mappedData = mapFieldsToDb({
            id: data.id || newId,
            ...finalData
        });

        const { data: inserted, error } = await supabase
            .from(tableName)
            .insert(mappedData)
            .select()
            .single();

        if (error) throw error;
        return { data: mapFieldsToFrontend(inserted) };
    },

    /**
     * PATCH: Updates specific fields in Supabase.
     */
    patch: async (url, data) => {
        const { tableName, id } = parseRESTUrl(url);
        if (!id) throw new Error("ID required for PATCH");

        const mappedData = mapFieldsToDb(data);

        const { data: updatedList, error } = await supabase
            .from(tableName)
            .update(mappedData)
            .eq('id', id)
            .select();

        if (error) throw error;
        const updated = updatedList && updatedList.length > 0 ? updatedList[0] : null;
        return { data: mapFieldsToFrontend(updated) };
    },

    /**
     * PUT: Updates profile or handles standard updates in Supabase.
     */
    put: async (url, data) => {
        // --- VIRTUAL ROUTE: UPDATE USER PROFILE ---
        if (url === '/users/profile') {
            const userData = JSON.parse(localStorage.getItem('postpal_user'));
            if (!userData) throw new Error("Session expired.");

            let updateData = {};
            if (data instanceof FormData) {
                updateData.username = data.get('username');
                updateData.email = data.get('email');
                updateData.bio = data.get('bio');
                
                const file = data.get('profile_picture');
                if (file && file instanceof File && file.size > 0) {
                    const base64Promise = new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const img = new Image();
                            img.onload = () => {
                                const canvas = document.createElement('canvas');
                                let width = img.width;
                                let height = img.height;
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

            const mappedData = mapFieldsToDb(updateData);

            const { data: updatedUser, error } = await supabase
                .from('users')
                .update(mappedData)
                .eq('id', userData.id)
                .select()
                .single();

            if (error) throw error;

            return { 
                data: { 
                    user: mapFieldsToFrontend(updatedUser), 
                    token: localStorage.getItem('postpal_token') 
                } 
            };
        }

        // --- STANDARD PUT ---
        const { tableName, id } = parseRESTUrl(url);
        const mappedData = mapFieldsToDb(data);

        const { data: updatedList, error } = await supabase
            .from(tableName)
            .update(mappedData)
            .eq('id', id || data.id)
            .select();

        if (error) throw error;
        const updated = updatedList && updatedList.length > 0 ? updatedList[0] : null;
        return { data: mapFieldsToFrontend(updated) };
    },

    /**
     * DELETE: Removes a record from Supabase.
     */
    delete: async (url) => {
        const { tableName, id } = parseRESTUrl(url);
        if (!id) throw new Error("ID required for DELETE");

        const { data: deletedList, error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        const deleted = deletedList && deletedList.length > 0 ? deletedList[0] : null;
        return { data: mapFieldsToFrontend(deleted) };
    }
};

export default API;
