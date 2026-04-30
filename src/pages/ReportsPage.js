// src/pages/ReportsPage.js — Admin Reports (Glassmorphism Light/Dark)
import React, { useState, useEffect } from 'react';
import API from '../api/json';
import { Trash2, CheckSquare, Flag, Clock, AlertTriangle } from 'lucide-react';

const reasonColors = {
    Spam: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
    Harassment: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
    Misinformation: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
    Other: 'bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-400 border-gray-200 dark:border-slate-500/30',
};

export default function ReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');

    useEffect(() => { fetchReports(); }, []);

    async function fetchReports() {
        try {
            const res = await API.get('/admin/reports');
            // Safely handle non-array responses
            setReports(Array.isArray(res.data) ? res.data : []);
        } catch (err) { 
            console.error('Failed to fetch reports:', err); 
            setReports([]); 
        } finally { 
            setLoading(false); 
        }
    }

    async function handleDeletePost(postId, reportId) {
        if (!window.confirm('Delete this post and all related reports?')) return;
        try {
            await API.delete(`/posts/${postId}`);
            setReports(prev => prev.filter(r => r.post_id !== postId));
        } catch (err) { alert('Failed to delete post.'); }
    }

    async function handleDismiss(reportId) {
        try {
            await API.post(`/admin/reports/${reportId}/dismiss`);
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'DISMISSED' } : r));
        } catch (err) { alert('Failed to dismiss report.'); }
    }

    const filtered = filter === 'ALL' ? reports : reports.filter(r => r.status === filter);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in space-y-12 pb-24">

            {/* Main Reports Window */}
            <div className="retro-window">
                <div className="window-header">
                    <div className="flex items-center gap-2">
                        <Flag size={14} className="text-white/80" />
                        <span className="window-title">User Reports</span>
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
                            <h1 className="text-4xl font-black tracking-tighter text-[#2b2f5a] uppercase mb-2">Reports Management</h1>
                            <p className="text-[#8d92b3] text-[10px] font-black uppercase tracking-[0.3em]">Safety Monitor: Active</p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex bg-[#f0f0f0] border-2 border-[#c0c0c0] p-1 shadow-inner">
                            {['PENDING', 'DISMISSED', 'ALL'].map(f => {
                                const isActive = filter === f;
                                return (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                                            ? 'bg-white text-[#2b2f5a] shadow-[1px_1px_0px_#404040]'
                                            : 'text-[#8d92b3] hover:text-[#5f6487]'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-24 text-center animate-pulse">
                            <p className="text-[#8d92b3] font-black uppercase tracking-[0.2em]">Loading Reports...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-24 text-center bg-[#f0f0f0] border-4 border-dashed border-[#c0c0c0]">
                            <Flag size={64} className="mx-auto mb-6 text-[#7ea7ff]/20" />
                            <p className="text-[10px] font-black text-[#2b2f5a] uppercase tracking-[0.3em] mb-2">Queue Empty</p>
                            <p className="text-[#8d92b3] text-[9px] font-bold uppercase">No pending reports</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filtered.map(report => (
                                <div
                                    key={report.id}
                                    className={`bg-white border-2 border-[#e8ebf5] p-8 group relative transition-all ${report.status === 'DISMISSED'
                                        ? 'opacity-60 bg-[#f9f9fb]'
                                        : 'hover:border-[#7ea7ff] hover:shadow-[6px_6px_0px_#7ea7ff10]'
                                        }`}
                                >
                                    {/* Entry ID */}
                                    <div className="absolute top-0 right-0 py-1 px-3 bg-[#f0f0f0] border-b-2 border-l-2 border-[#e8ebf5] text-[8px] font-black text-[#8d92b3] uppercase">
                                        REPORT_ID: {report.id}
                                    </div>

                                    {/* Report Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-6 mb-8 pb-4 border-b border-[#f0f0f0]">
                                        <div className="flex items-center gap-4">
                                            <div className="hybrid-icon !bg-white">
                                                <AlertTriangle size={18} className="text-[#b25a5a]" />
                                            </div>
                                            <span className={`text-[10px] px-3 py-1 font-black uppercase tracking-[0.1em] border-2 ${reasonColors[report.reason]?.replace('bg-', 'bg-[#').replace('text-', 'text-[#').split(' ')[0] || 'bg-[#f0f0f0] text-[#5f6487] border-[#c0c0c0]'}`}>
                                                {report.reason}
                                            </span>
                                            {report.status === 'DISMISSED' && (
                                                <span className="text-[9px] font-black uppercase tracking-[0.1em] bg-[#ecfdf5] text-[#059669] border-2 border-[#059669]/30 px-3 py-1">
                                                    RESOLVED
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black text-[#8d92b3] flex items-center gap-2 uppercase tracking-[0.2em]">
                                            <Clock size={14} /> {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'LEGACY LOG'}
                                        </span>
                                    </div>

                                    {/* Info Block */}
                                    <div className="mb-8 space-y-4 bg-[#f8f9ff] border-2 border-[#f0f2ff] p-6 shadow-inner">
                                        <div className="flex items-start gap-4">
                                            <span className="text-[9px] font-black text-[#8d92b3] uppercase tracking-widest pt-0.5 shrink-0 w-28">Reporter:</span>
                                            <span className="text-sm font-black text-[#2b2f5a] uppercase">{report.reporter_name || 'Anonymous User'}</span>
                                        </div>
                                        {report.details && (
                                            <div className="flex items-start gap-4">
                                                <span className="text-[9px] font-black text-[#8d92b3] uppercase tracking-widest pt-0.5 shrink-0 w-28">Details:</span>
                                                <span className="text-sm font-medium text-[#5f6487] italic leading-relaxed">"{report.details}"</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Offending Post Preview */}
                                    <div className="border-2 border-[#f5c4c4] bg-[#fffbfb] p-6 mb-10 group-hover:bg-white transition-colors relative">
                                        <div className="absolute top-2 right-4 text-[8px] font-black text-[#b25a5a] opacity-30 mt-[-1rem]">EVIDENCE PREVIEW</div>
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="text-[8px] font-black text-[#b25a5a] uppercase tracking-widest bg-[#fbe3e3] px-2 py-0.5 border border-[#f5c4c4]">POST SOURCE</div>
                                            <div className="text-[8px] font-black text-[#7ea7ff] uppercase tracking-widest bg-[#eef3ff] px-2 py-0.5 border border-[#eef3ff]">{report.topic}</div>
                                        </div>
                                        <div className="p-4 bg-white border border-[#f5c4c4] shadow-inner mb-4">
                                            <p className="text-base text-[#2b2f5a] font-medium leading-relaxed border-l-4 border-[#f5c4c4] pl-5 italic">"{report.content}"</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {report.status === 'PENDING' && (
                                        <div className="flex flex-wrap gap-4">
                                            <button
                                                onClick={() => handleDeletePost(report.post_id, report.id)}
                                                className="flex-1 neumo-button !bg-[#fef2f2] !text-[#991b1b] !border-2 !border-[#fecaca] !rounded-none flex items-center justify-center gap-3 py-4 shadow-[4px_4px_0_0_#fecaca] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                                            >
                                                <Trash2 size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Delete Post</span>
                                            </button>
                                            <button
                                                onClick={() => handleDismiss(report.id)}
                                                className="flex-1 neumo-button !bg-white !text-[#5f6487] !border-2 !border-[#c0c0c0] !rounded-none flex items-center justify-center gap-3 py-4 shadow-[4px_4px_0_0_#c0c0c0] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                                            >
                                                <CheckSquare size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Dismiss Report</span>
                                            </button>
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
