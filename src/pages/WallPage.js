// src/pages/WallPage.js — Modern SaaS-style Community Feed
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/json';
import { Heart, MessageCircle, Flag, Shield, SendHorizonal, Trash2, Clock, Monitor } from 'lucide-react';

const CATEGORIES = ['News', 'Education', 'Gaming', 'Life', 'Wellness', 'Others'];

export default function WallPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('All');

    useEffect(() => { fetchPosts(); }, []);

    async function fetchPosts() {
        try {
            const res = await API.get('/posts');
            setPosts(res.data);
        } catch (err) { console.error('Failed to load posts:', err); }
        finally { setLoading(false); }
    }

    async function handleLike(postId) {
        if (!user) return alert('Please login to like posts.');
        try {
            const postToLike = posts.find(p => p.id === postId);
            const newLikesCount = (postToLike.likes_count || 0) + 1;
            
            // Updating ONLY the likes_count field (very efficient)
            await API.patch(`/posts/${postId}`, { likes_count: newLikesCount });
            
            // Refresh the screen
            fetchPosts();
        } catch (err) { console.error('Like error:', err); }
    }

    const filtered = filterCategory === 'All' ? posts : posts.filter(p => p.topic === filterCategory);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-blue-500 text-lg font-medium animate-pulse">Loading PostPal...</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 pb-20 animate-fade-in">
            <div className="retro-window">
                <div className="window-header">
                    <div className="flex items-center gap-2">
                        <Monitor size={14} className="text-white/80" />
                        <span className="window-title">Community Feed</span>
                    </div>
                    <div className="window-controls">
                        <div className="control-btn">—</div>
                        <div className="control-btn">□</div>
                        <div className="control-btn text-red-500">X</div>
                    </div>
                </div>

                <div className="bg-[#f0f0f0] p-8 md:p-12">
                    {/* Sub-Header */}
                    <div className="mb-12 border-b-2 border-white shadow-[0_2px_0_0_#c0c0c0] pb-8">
                        <h1 className="text-3xl font-black tracking-tight text-[#2b2f5a] mb-2 uppercase">Network Feed</h1>
                        <p className="text-[#5f6487] text-sm font-bold uppercase tracking-widest leading-relaxed">Discover ideas and connect with students in a gentle, creative space.</p>
                    </div>

                    {/* Category Filter Chips - Retro Block Style */}
                    <div className="mb-10">
                        <label className="block text-[10px] font-black text-[#8d92b3] mb-4 uppercase tracking-[0.2em] ml-1">Select Topic</label>
                        <div className="flex flex-wrap gap-2">
                            {['All', ...CATEGORIES].map(cat => {
                                const isActive = filterCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`px-6 py-2 text-xs font-black uppercase tracking-tight transition-all border-2 ${isActive
                                            ? 'bg-[#7ea7ff] text-white border-[#2b2f5a] shadow-none translate-x-[2px] translate-y-[2px]'
                                            : 'bg-[#c0c0c0] text-[#2b2f5a] border-t-white border-l-white border-r-[#404040] border-b-[#404040] hover:bg-[#d0d0d0]'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-12">
                        {/* Create Post Area */}
                        {user && (
                            <div className="bg-white border-2 border-[#c0c0c0] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] p-6 mb-4">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="hybrid-icon !w-14 !h-14">
                                            {user.profile_picture ? (
                                                <img
                                                    src={user.profile_picture_url || user.profile_picture}
                                                    alt={user.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-xl font-black">{(user.username || "User").charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[#2b2f5a] font-black text-lg uppercase tracking-tighter">What's on your mind?</p>
                                            <p className="text-[#8d92b3] text-[10px] font-bold uppercase tracking-widest mt-0.5">Share your thoughts to others</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/create')}
                                        className="px-8 py-3 bg-[#c0c0c0] text-[#2b2f5a] text-xs font-black uppercase tracking-[0.2em] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[2px_2px_0_0_#00000020] hover:bg-[#d0d0d0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                    >
                                        Create Post
                                    </button>
                                </div>
                                <div className="mt-8 flex flex-col items-center gap-4 pb-6 border-b-2 border-dashed border-[#2b2f5a]/20">
                                    <button
                                        onClick={() => {
                                            if (posts.length === 0) return alert("No posts available!");
                                            const latest = posts[posts.length - 1];
                                            alert(`LATEST POST DATA\n------------------\nAUTHOR: ${latest.username}\nCONTENT: ${latest.content}\nDATE: ${new Date(latest.created_at).toLocaleString()}`);
                                        }}
                                        className="px-6 py-2 bg-[#10b981] text-white text-[9px] font-black uppercase tracking-[0.2em] border-2 border-t-[#34d399] border-l-[#34d399] border-r-[#064e3b] border-b-[#064e3b] shadow-[4px_4px_0_0_#00000020] hover:bg-[#059669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-3"
                                    >
                                        <div className="w-2 h-2 bg-white animate-pulse" />
                                        Fetch Latest Data Stream
                                    </button>
                                    <p className="text-[8px] font-black text-[#8d92b3] uppercase tracking-widest opacity-40">System_Status: Operational</p>
                                </div>
                            </div>
                        )}

                        {/* Feed List */}
                        <div className="space-y-8 mt-4">
                            {filtered.length === 0 ? (
                                <div className="py-24 text-center border-4 border-dashed border-[#c0c0c0] bg-white/50">
                                    <MessageCircle size={64} className="mx-auto mb-6 opacity-10" />
                                    <p className="text-sm font-black uppercase tracking-widest text-[#8d92b3]">The feed is quiet... for now.</p>
                                </div>
                            ) : (
                                filtered.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        user={user}
                                        onLike={handleLike}
                                        onDeleteComment={fetchPosts}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── PostCard Component ─────────────────────────────────────────
function PostCard({ post, user, onLike, onDeleteComment }) {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    async function fetchComments() {
        setLoadingComments(true);
        try {
            const res = await API.get(`/posts/${post.id}/comments`);
            setComments(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingComments(false); }
    }

    function toggleComments() {
        if (!showComments) fetchComments();
        setShowComments(!showComments);
    }

    async function handleAddComment(e) {
        e.preventDefault();
        if (!commentText.trim() || !user) return;
        try {
            const newComment = {
                content: commentText,
                username: user.username,
                created_at: new Date().toISOString()
            };
            
            const res = await API.post(`/posts/${post.id}/comments`, newComment);
            setComments(prev => [...prev, res.data]);
            setCommentText('');
            onDeleteComment(); // Refreshes the comment count on the Wall
        } catch (err) { alert('Failed to comment.'); }
    }

    async function handleDeleteComment(commentId) {
        try {
            await API.delete(`/admin/comments/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
            onDeleteComment();
        } catch (err) { alert('Failed to delete comment.'); }
    }

    return (
        <div className="bg-white border-2 border-[#e8ebf5] transition-all mb-4">
            <div className="window-header !bg-[#f0f0f0] !border-b-2 !border-[#c0c0c0]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#7ea7ff] rounded-full" />
                    <span className="window-title !text-[#2b2f5a] !text-shadow-none uppercase !text-[10px]">Post #{post.id}</span>
                </div>
                <div className="window-controls">
                    <div className="control-btn">—</div>
                    <div className="control-btn">□</div>
                </div>
            </div>

            <div className="p-6 sm:p-8 bg-[#fdfdfd]">
                {/* Author Section */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white border-2 border-[#2b2f5a] shadow-[3px_3px_0px_#7ea7ff] flex items-center justify-center text-[#7ea7ff] font-bold shrink-0 overflow-hidden">
                            {post.profile_picture ? (
                                <img
                                    src={post.profile_picture_url || post.profile_picture}
                                    alt={post.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-xl">{(post.username || "👤").charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-lg text-[#2b2f5a] leading-none uppercase tracking-tighter">{post.username}</span>
                                {post.role === 'admin' && (
                                    <span className="flex items-center gap-1 bg-[#2b2f5a] text-white text-[9px] px-2 py-0.5 rounded-sm font-black uppercase tracking-widest border border-white/20">
                                        <Shield size={10} /> Verified Staff
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1.5 text-[10px] text-[#8d92b3] font-black uppercase tracking-widest">
                                    <Clock size={12} /> {new Date(post.created_at).toLocaleDateString()}
                                </span>
                                <span className="px-2 py-0.5 bg-[#eef3ff] text-[#7ea7ff] text-[10px] font-black uppercase border border-[#7ea7ff]/30">
                                    {post.topic}
                                </span>
                            </div>
                        </div>
                    </div>
                    {user && user.role !== 'admin' && (
                        <button onClick={() => setShowReportModal(true)} className="control-btn !w-8 !h-8 !bg-[#fbe3e3] !border-[#b25a5a] text-[#b25a5a]" title="Report post">
                            <Flag size={14} />
                        </button>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-4 bg-white border-2 border-[#e8ebf5] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)] mb-6">
                    <p className="text-md leading-relaxed text-[#2b2f5a] whitespace-pre-wrap font-medium">{post.content}</p>
                </div>

                {/* Optional Image */}
                {post.image_path && (
                    <div className="border-2 border-[#2b2f5a] shadow-[4px_4px_0px_#2b2f5a] mb-6 overflow-hidden bg-black">
                        <img
                            src={post.image || post.image_path}
                            alt="Post"
                            className="w-full h-80 object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
                        />
                    </div>
                )}

                {/* Interaction Row */}
                <div className="flex items-center gap-6 pt-6 border-t-2 border-[#f0f0f0]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onLike(post.id)}
                            className="flex items-center gap-3 group"
                        >
                            <div className={`hybrid-icon ${post.likes_count > 0 ? 'bg-[#fbe3e3] border-[#b25a5a] shadow-[#b25a5a]/20' : ''}`}>
                                <Heart size={20} className={post.likes_count > 0 ? 'fill-[#b25a5a] text-[#b25a5a]' : 'text-[#2b2f5a]'} />
                            </div>
                            <span className="font-black text-sm text-[#2b2f5a] tabular-nums">{post.likes_count}</span>
                        </button>

                        <button
                            onClick={toggleComments}
                            className="flex items-center gap-3 group"
                        >
                            <div className={`hybrid-icon ${showComments ? 'bg-[#eef3ff] border-[#7ea7ff] shadow-[#7ea7ff]/20' : ''}`}>
                                <MessageCircle size={20} className="text-[#2b2f5a]" />
                            </div>
                            <span className="font-black text-sm text-[#2b2f5a] tabular-nums">{post.comment_count}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments Expansion */}
            {showComments && (
                <div className="mt-8 pt-8 border-t border-gray-100 animate-fade-in">
                    {loadingComments ? (
                        <p className="text-sm text-[#8d92b3] animate-pulse py-4 font-bold flex justify-center">Loading responses...</p>
                    ) : (
                        <div className="space-y-5 mb-8">
                            {comments.length === 0 && <p className="text-sm text-[#8d92b3] italic text-center py-4 bg-[#f7f8fc] rounded-2xl">No comments yet. Start the conversation!</p>}
                            {comments.map(c => (
                                <div key={c.id} className="flex items-start gap-4 animate-fade-in">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#f3f4fa] flex items-center justify-center text-sm font-bold text-[#5f6487] shrink-0 mt-1 border border-white/50">
                                        {c.profile_picture ? (
                                            <img
                                                src={c.profile_picture_url || c.profile_picture}
                                                alt={c.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            c.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 bg-[#f7f8fc] rounded-2xl p-4 border border-[#e8ebf5] hover:bg-white transition-colors duration-300">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-[#2b2f5a]">{c.username}</span>
                                                <span className="text-[11px] text-[#8d92b3] font-bold uppercase tracking-wider">{new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {user?.role === 'admin' && (
                                                <button onClick={() => handleDeleteComment(c.id)} className="text-[#b25a5a] hover:opacity-70 transition p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-[#5f6487] leading-relaxed">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {user ? (
                        <form onSubmit={handleAddComment} className="flex gap-3">
                            <input
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="Add to the discussion..."
                                className="flex-1 neumo-input px-6 h-12 text-sm shadow-inner focus:shadow-none"
                            />
                            <button type="submit" className="neumo-button p-0 w-12 h-12 flex items-center justify-center">
                                <SendHorizonal size={22} />
                            </button>
                        </form>
                    ) : (
                        <div className="p-4 bg-[#eef3ff] rounded-2xl text-center">
                            <p className="text-sm text-[#5f6487] font-bold">
                                Join our community to join the conversation. <Link to="/login" className="text-[#7ea7ff] hover:underline">Link Studio</Link>
                            </p>
                        </div>
                    )}
                </div>
            )}

            {showReportModal && <ReportModal postId={post.id} onClose={() => setShowReportModal(false)} />}
        </div>
    );
}

// ─── Report Modal ──────────────────────────────────────────────
function ReportModal({ postId, onClose }) {
    const [reason, setReason] = useState('Spam');
    const [details, setDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await API.post('/reports', { post_id: postId, reason, details });
            setSubmitted(true);
            setTimeout(onClose, 1500);
        } catch (err) { setError(err.response?.data?.message || 'Failed to submit report.'); }
    }

    return (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Report Post</h3>
                {submitted ? (
                    <p className="text-green-500 font-medium text-center py-4">Report submitted. Thank you.</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                            <select
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                {['Spam', 'Harassment', 'Misinformation', 'Other'].map(r => <option key={r} value={r} className="dark:bg-slate-800">{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details (optional)</label>
                            <textarea
                                value={details}
                                onChange={e => setDetails(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Explain the issue..."
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition font-medium">
                                Cancel
                            </button>
                            <button type="submit" className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-md font-medium">
                                Submit
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
