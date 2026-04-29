/**
 * AdminModerationPage.js
 * 
 * HOW THIS WORKS:
 * 1. This page is only accessible to users with the "admin" role.
 * 2. It fetches all posts that have a "PENDING" status.
 * 3. The Admin can Approve (changes status to APPROVED) or Reject (changes status to REJECTED).
 * 4. It also shows system-wide stats like total users and total posts.
 */

import React, { useState, useEffect } from 'react';
import API from '../api/json';
import { CheckCircle, XCircle, Trash2, Clock, Users, FileText, AlertTriangle, Flag, Shield } from 'lucide-react';

export default function AdminModerationPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [stats, setStats] = useState({});

    useEffect(() => {
        fetchPending();
        fetchStats();
    }, []);

    async function fetchPending() {
        try {
            // Our API helper has a virtual route for this
            const res = await API.get('/admin/pending');
            const data = Array.isArray(res.data) ? res.data : [];
            setPosts(data);
        } catch (err) { console.error('Failed to load pending posts:', err); }
        finally { setLoading(false); }
    }

    async function fetchStats() {
        try {
            // Our API helper combines users and posts data for this
            const res = await API.get('/admin/stats');
            setStats(res.data || {});
        } catch (err) { console.error('Failed to load stats:', err); }
    }

    async function handleApprove(id) {
        try {
            // Standard json-server: PATCH updates only the fields we send
            await API.patch(`/posts/${id}`, { status: 'APPROVED' });
            
            // Remove from the list on screen
            setPosts(prev => prev.filter(p => p.id !== id));
            
            // Update stats counter
            setStats(s => ({ ...s, pending_posts: Math.max(0, (s.pending_posts || 0) - 1) }));
        } catch (err) { alert('Failed to approve post.'); }
    }

    async function handleReject(id) {
        if (!rejectReason.trim()) return alert('Please provide a reason for rejection.');
        try {
            // Update status and save the reason
            await API.patch(`/posts/${id}`, { 
                status: 'REJECTED', 
                rejection_reason: rejectReason 
            });
            
            setPosts(prev => prev.filter(p => p.id !== id));
            setRejectingId(null);
            setRejectReason('');
        } catch (err) { alert('Failed to reject post.'); }
    }

    async function handleDelete(id) {
        if (!window.confirm('Permanently delete this post?')) return;
        try {
            // Standard json-server: DELETE /posts/ID
            await API.delete(`/posts/${id}`);
            setPosts(prev => prev.filter(p => p.id !== id));
        } catch (err) { alert('Failed to delete post.'); }
    }

    const statItems = [
        { label: 'Total Users', value: stats.total_users || 0, icon: <Users size={24} className="text-blue-500" /> },
        { label: 'Total Posts', value: stats.total_posts || 0, icon: <FileText size={24} className="text-emerald-500" /> },
        { label: 'Pending', value: stats.pending_posts || 0, icon: <AlertTriangle size={24} className="text-amber-500" /> },
        { label: 'Reports', value: stats.total_reports || 0, icon: <Flag size={24} className="text-rose-500" /> },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in space-y-12 pb-24">

            {/* Main Admin Window */}
            <div className="retro-window">
                <div className="window-header">
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="text-white/80" />
                        <span className="window-title">Admin Moderation</span>
                    </div>
                    <div className="window-controls">
                        <div className="control-btn">—</div>
                        <div className="control-btn">□</div>
                        <div className="control-btn text-red-500">X</div>
                    </div>
                </div>

                <div className="p-10 bg-[#fdfdfd]">
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-[#f0f0f0]">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-[#2b2f5a] uppercase mb-2">Pending Posts</h1>
                            <p className="text-[#8d92b3] text-[10px] font-black uppercase tracking-[0.3em]">System Monitor: Active</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-[#2b2f5a] p-4 text-white">
                                <span className="block text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Queue Size</span>
                                <span className="flex items-center justify-center text-2xl font-black tabular-nums leading-none tracking-tight">
                                    {posts.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                        {statItems.map(s => (
                            <div key={s.label} className="bg-white border-2 border-[#c0c0c0] p-6 flex flex-col items-center group hover:border-[#7ea7ff] transition-all">
                                <div className="hybrid-icon mb-4 !w-12 !h-12">
                                    {s.icon}
                                </div>
                                <div className="text-2xl font-black text-[#2b2f5a] mb-1 tabular-nums">{s.value}</div>
                                <div className="text-[9px] font-black text-[#8d92b3] uppercase tracking-[0.2em]">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-[2px] bg-[#f0f0f0] flex-1" />
                        <h2 className="text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.4em]">Awaiting Validation</h2>
                        <div className="h-[2px] bg-[#f0f0f0] flex-1" />
                    </div>

                    {loading ? (
                        <div className="py-24 text-center animate-pulse">
                            <p className="text-[#8d92b3] font-black uppercase tracking-[0.2em]">Synchronizing Records...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="py-24 text-center bg-[#f0f0f0] border-4 border-dashed border-[#c0c0c0]">
                            <CheckCircle size={64} className="mx-auto mb-6 text-[#7ea7ff]/20" />
                            <p className="text-[10px] font-black text-[#2b2f5a] uppercase tracking-[0.3em] mb-2">Queue Clear</p>
                            <p className="text-[#8d92b3] text-[9px] font-bold uppercase">No posts awaiting review</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {posts.map(post => (
                                <div key={post.id} className="bg-white border-2 border-[#e8ebf5] p-8 group relative hover:border-[#7ea7ff] transition-all">
                                    {/* Item ID tag */}
                                    <div className="absolute top-0 right-0 py-1 px-3 bg-[#f0f0f0] border-b-2 border-l-2 border-[#e8ebf5] text-[8px] font-black text-[#8d92b3] uppercase">
                                        POST_ID: {post.id}
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#f0f0f0]">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-white border-2 border-[#2b2f5a] shadow-[4px_4px_0px_#7ea7ff] flex items-center justify-center text-[#7ea7ff] font-black text-xl">
                                                {post.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-[#2b2f5a] uppercase tracking-tight">{post.username}</div>
                                                <div className="text-[10px] text-[#8d92b3] font-black flex items-center gap-2 mt-1 uppercase tracking-widest">
                                                    <Clock size={12} /> {new Date(post.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[#fffbeb] text-[#92400e] text-[9px] font-black px-4 py-1.5 border-2 border-[#fde68a] uppercase tracking-widest">
                                            PENDING_REVIEW
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="bg-[#fbfcff] border border-[#f0f0f0] p-6 mb-8 hover:bg-white transition-colors">
                                        <p className="text-[#2b2f5a] text-lg leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>

                                        {post.image || post.image_path ? (
                                             <div className="mt-6 border-4 border-[#f0f0f0] shadow-sm">
                                                 <img
                                                     src={post.image || post.image_path}
                                                     alt="Post"
                                                     className="w-full max-h-[450px] object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                 />
                                             </div>
                                         ) : null}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleApprove(post.id)}
                                            className="flex-1 neumo-button !bg-[#ecfdf5] !text-[#065f46] !border-2 !border-[#a7f3d0] flex items-center justify-center gap-3 py-4 !rounded-none shadow-[4px_4px_0_0_#a7f3d0] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                                        >
                                            <CheckCircle size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Approve</span>
                                        </button>
                                        <button
                                            onClick={() => setRejectingId(post.id)}
                                            className="flex-1 neumo-button !bg-[#fffbeb] !text-[#92400e] !border-2 !border-[#fde68a] flex items-center justify-center gap-3 py-4 !rounded-none shadow-[4px_4px_0_0_#fde68a] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                                        >
                                            <XCircle size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="flex-1 neumo-button !bg-[#fef2f2] !text-[#991b1b] !border-2 !border-[#fecaca] flex items-center justify-center gap-3 py-4 !rounded-none shadow-[4px_4px_0_0_#fecaca] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                                        >
                                            <Trash2 size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
                                        </button>
                                    </div>

                                    {/* Reject Reason Form */}
                                    {rejectingId === post.id && (
                                        <div className="mt-8 p-8 bg-[#fffbeb] border-2 border-[#fde68a] animate-fade-in">
                                            <label className="block text-[10px] font-black text-[#92400e]/70 uppercase tracking-[0.2em] mb-4 ml-1">Reason for Rejection</label>
                                            <input
                                                type="text"
                                                placeholder="Enter reason..."
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                className="w-full neumo-input border-2 border-[#fde68a] bg-white px-5 py-4 text-[#92400e] placeholder-[#92400e]/40 focus:border-[#d97706] transition-colors mb-6"
                                            />
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => handleReject(post.id)}
                                                    className="flex-1 bg-[#d97706] hover:bg-[#b45309] text-white font-black py-4 border-2 border-[#92400e] shadow-[4px_4px_0_0_#92400e] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all uppercase text-[10px] tracking-widest"
                                                >
                                                    Confirm Reject
                                                </button>
                                                <button
                                                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                    className="flex-1 bg-white hover:bg-[#f0f0f0] text-[#5f6487] font-black py-4 border-2 border-[#c0c0c0] transition-all uppercase text-[10px] tracking-widest"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

