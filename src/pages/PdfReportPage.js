// src/pages/PdfReportPage.js — Admin PDF Report (Glassmorphism Light/Dark)
import React, { useState } from 'react';
import API from '../api/json';
import { FileDown, Users, Heart, FileText, BarChart2, Loader, TrendingUp } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PdfReportPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function fetchData() {
        setLoading(true); setError('');
        try {
            const res = await API.get('/admin/report/data');
            setData(res.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed to load report data.'); }
        finally { setLoading(false); }
    }

    function handleExport() {
        if (!data) return;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const generatedDate = new Date(data.generatedAt).toLocaleString();

        // PDF Cover / Header
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.text('PostPal', 14, 18);
        doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text('Community Analytics Report', 14, 27);
        doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text(`Generated: ${generatedDate}`, 14, 35);

        // Platform Summary
        doc.setTextColor(30, 41, 59); doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Platform Summary', 14, 52);
        const t = data.totals;
        autoTable(doc, {
            startY: 56, head: [['Metric', 'Count']],
            body: [['Total Users', t.total_users], ['Total Posts', t.total_posts], ['Total Likes', t.total_likes], ['Total Comments', t.total_comments], ['Total Reports', t.total_reports]],
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [241, 245, 249] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { halign: 'center' } }, margin: { left: 14, right: 14 }, theme: 'grid'
        });

        // Per-User Report
        const afterSummary = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.text('User Activity Report', 14, afterSummary);
        autoTable(doc, {
            startY: afterSummary + 4, head: [['#', 'Username', 'Email', 'Role', 'Posts', 'Likes', 'Apprd', 'Pend', 'Rejd']],
            body: data.users.map((u, i) => [i + 1, u.username, u.email, u.role, u.total_posts, u.total_likes, u.approved_posts, u.pending_posts, u.rejected_posts]),
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 }, bodyStyles: { fontSize: 8 }, alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 28 }, 2: { cellWidth: 45 }, 3: { cellWidth: 16, halign: 'center' }, 4: { cellWidth: 14, halign: 'center' }, 5: { cellWidth: 14, halign: 'center' }, 6: { cellWidth: 16, halign: 'center' }, 7: { cellWidth: 15, halign: 'center' }, 8: { cellWidth: 15, halign: 'center' } }, margin: { left: 14, right: 14 }, theme: 'grid'
        });

        // Trending & Top Posts
        doc.addPage(); doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('PostPal — Trending Topics & Top Posts', 14, 13);
        doc.setTextColor(30, 41, 59); doc.setFontSize(13); doc.text('Trending Topics', 14, 30);
        autoTable(doc, {
            startY: 34, head: [['#', 'Category', 'Total Posts', 'Total Likes', 'Total Comments']],
            body: data.trendingTopics.map((t, i) => [i + 1, t.topic, t.total_posts, t.total_likes, t.total_comments]),
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 }, bodyStyles: { fontSize: 8 }, alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 40 }, 2: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 30, halign: 'center' }, 4: { cellWidth: 30, halign: 'center' } }, margin: { left: 14, right: 14 }, theme: 'grid'
        });

        const afterTopics = doc.lastAutoTable.finalY + 12;
        doc.setTextColor(30, 41, 59); doc.setFontSize(13); doc.text('Top 20 Posts by Likes', 14, afterTopics);
        autoTable(doc, {
            startY: afterTopics + 4, head: [['#', 'Author', 'Category', 'Likes', 'Date', 'Content Preview']],
            body: data.topPosts.map((p, i) => [i + 1, p.username + (p.role === 'admin' ? ' ★' : ''), p.topic, p.likes_count, new Date(p.created_at).toLocaleDateString(), p.content.length > 80 ? p.content.substring(0, 80) + '…' : p.content]),
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 }, bodyStyles: { fontSize: 7.5 }, alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 25 }, 2: { cellWidth: 22 }, 3: { cellWidth: 12, halign: 'center' }, 4: { cellWidth: 22 }, 5: { cellWidth: 'auto' } }, margin: { left: 14, right: 14 }, theme: 'grid'
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i); doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.text(`PostPal Analytics Report — Page ${i} of ${pageCount}`, 14, 292); doc.text('Confidential — Admin Use Only', pageWidth - 14, 292, { align: 'right' });
        }

        const dateStr = new Date().toISOString().slice(0, 10);
        doc.save(`PostPal_Report_${dateStr}.pdf`);
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in space-y-12 pb-24">

            {/* Intelligence Window */}
            <div className="retro-window">
                <div className="window-header">
                    <div className="flex items-center gap-2">
                        <BarChart2 size={14} className="text-white/80" />
                        <span className="window-title">Admin Analytics</span>
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
                            <h1 className="text-4xl font-black tracking-tighter text-[#2b2f5a] uppercase mb-2">Community Intelligence</h1>
                            <p className="text-[#8d92b3] text-[10px] font-black uppercase tracking-[0.3em]">Active Monitoring: Active</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={fetchData} disabled={loading}
                                className="neumo-button !bg-white !text-[#2b2f5a] !border-2 !border-[#c0c0c0] !rounded-none flex items-center gap-3 py-4 px-8 shadow-[4px_4px_0_0_#c0c0c0] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                            >
                                <BarChart2 size={20} className="text-[#7ea7ff]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{loading ? 'COLLECTING DATA...' : data ? 'REFRESH' : 'INITIALIZE'}</span>
                            </button>

                            {data && (
                                <button
                                    onClick={handleExport}
                                    className="neumo-button !bg-[#2b2f5a] !text-white !border-2 !border-[#2b2f5a] !rounded-none flex items-center gap-3 py-4 px-8 shadow-[4px_4px_0_0_#7ea7ff] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                                >
                                    <FileDown size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Export PDF</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-10 p-8 bg-[#fef2f2] border-2 border-[#fecaca] text-[#991b1b] text-[12px] font-black uppercase tracking-tight text-center flex items-center justify-center gap-3">
                            <TrendingUp size={16} className="rotate-180" />
                            ERROR: {error}
                        </div>
                    )}

                    {(loading && (
                        <div className="py-32 flex flex-col items-center justify-center gap-8 text-[#7ea7ff]">
                            <div className="relative">
                                <Loader size={80} className="animate-spin opacity-20" />
                                <Loader size={40} className="animate-spin absolute inset-0 m-auto" />
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-[0.5em] animate-pulse">Processing Analytics...</span>
                        </div>
                    )) || (data && (
                        <div className="space-y-12 animate-fade-in">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {[
                                    { label: 'Total Users', value: data.totals.total_users, icon: <Users size={22} />, color: '#7ea7ff' },
                                    { label: 'Total Posts', value: data.totals.total_posts, icon: <FileText size={22} />, color: '#10b981' },
                                    { label: 'Total Likes', value: data.totals.total_likes, icon: <Heart size={22} />, color: '#f43f5e' },
                                    { label: 'Total Comments', value: data.totals.total_comments, icon: <BarChart2 size={22} />, color: '#8b5cf6' },
                                    { label: 'Total Reports', value: data.totals.total_reports, icon: <FileDown size={22} />, color: '#f59e0b' },
                                ].map(s => (
                                    <div key={s.label} className="bg-white border-2 border-[#c0c0c0] p-6 flex flex-col items-center group hover:border-[#7ea7ff] transition-all">
                                        <div className="hybrid-icon mb-4 !w-12 !h-12" style={{ color: s.color }}>
                                            {s.icon}
                                        </div>
                                        <div className="text-2xl font-black text-[#2b2f5a] mb-1 tabular-nums">{s.value.toLocaleString()}</div>
                                        <div className="text-[9px] font-black text-[#8d92b3] uppercase tracking-[0.2em]">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Main Data Tables */}
                            <div className="border-2 border-[#e8ebf5] bg-white">
                                <div className="px-8 py-4 border-b-2 border-[#f0f0f0] bg-[#f7f8fc] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="text-[#7ea7ff]" />
                                        <h3 className="text-[10px] font-black text-[#2b2f5a] uppercase tracking-[0.3em]">User Activity Registry</h3>
                                    </div>
                                    <span className="text-[8px] font-black text-[#8d92b3] uppercase tracking-widest">ROWS_01-10_OF_STREAM</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white border-b-2 border-[#f0f0f0]">
                                                <th className="px-8 py-5 text-[9px] font-black text-[#8d92b3] uppercase tracking-widest">Pos</th>
                                                <th className="px-8 py-5 text-[9px] font-black text-[#8d92b3] uppercase tracking-widest">Handle</th>
                                                <th className="px-8 py-5 text-[9px] font-black text-[#8d92b3] uppercase tracking-widest">Network_Address</th>
                                                <th className="px-8 py-5 text-center text-[9px] font-black text-[#8d92b3] uppercase tracking-widest">Objects</th>
                                                <th className="px-8 py-5 text-center text-[9px] font-black text-[#8d92b3] uppercase tracking-widest">Karma_Idx</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y border-b border-[#f0f0f0]">
                                            {data.users.slice(0, 10).map((u, i) => (
                                                <tr key={u.id} className="hover:bg-[#f8f9ff] transition-colors group">
                                                    <td className="px-8 py-5 text-[10px] font-black text-[#8d92b3] tabular-nums font-mono">{i + 1}</td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 border-2 border-[#2b2f5a] flex items-center justify-center text-[#7ea7ff] font-black text-[10px] uppercase shadow-[2px_2px_0px_#7ea7ff]">
                                                                {u.username.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-black text-[#2b2f5a] uppercase tracking-tight">{u.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-xs font-medium text-[#5f6487] font-mono">{u.email}</td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-xs font-black text-[#2b2f5a] bg-white px-3 py-1 border-2 border-[#f0f0f0] tabular-nums">{u.total_posts}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-xs font-black text-[#f43f5e] bg-[#fff1f2] px-3 py-1 border-2 border-[#ffe4e6] tabular-nums">{u.total_likes}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Double Column Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="border-2 border-[#e8ebf5] bg-white">
                                    <div className="px-8 py-4 border-b-2 border-[#f0f0f0] bg-[#f7f8fc] flex items-center gap-4">
                                        <TrendingUp size={18} className="text-[#8b5cf6]" />
                                        <h3 className="text-[10px] font-black text-[#2b2f5a] uppercase tracking-[0.3em]">Trending Topics</h3>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {data.trendingTopics.map((t, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-[#f8f9ff] border-2 border-[#f0f2ff] hover:bg-white transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[9px] font-black text-[#8d92b3] font-mono tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                                                    <span className="font-black text-[#2b2f5a] uppercase tracking-tight">{t.topic}</span>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-center">
                                                        <div className="text-sm font-black text-[#2b2f5a] tabular-nums">{t.total_posts}</div>
                                                        <div className="text-[8px] font-black text-[#8d92b3] uppercase tracking-widest">OBJS</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm font-black text-[#f43f5e] tabular-nums">{t.total_likes}</div>
                                                        <div className="text-[8px] font-black text-[#8d92b3] uppercase tracking-widest">KRM</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-2 border-[#e8ebf5] bg-white">
                                    <div className="px-8 py-4 border-b-2 border-[#f0f0f0] bg-[#f7f8fc] flex items-center gap-4">
                                        <Heart size={18} className="text-[#f43f5e]" />
                                        <h3 className="text-[10px] font-black text-[#2b2f5a] uppercase tracking-[0.3em]">Top Performing Posts</h3>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {data.topPosts.slice(0, 5).map((p, i) => (
                                            <div key={p.id} className="p-5 bg-[#f8f9ff] border-2 border-[#f0f2ff] hover:bg-white transition-all relative">
                                                <div className="flex items-center justify-between mb-3 border-b border-[#f0f2ff] pb-2">
                                                    <span className="text-[10px] font-black text-[#2b2f5a] uppercase truncate max-w-[150px]">USR: {p.username}</span>
                                                    <span className="text-[9px] font-black text-[#7ea7ff] uppercase tracking-[0.2em]">{p.topic}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="text-xs text-[#5f6487] italic line-clamp-1 border-l-2 border-[#7ea7ff] pl-3">"{p.content}"</p>
                                                    <span className="flex items-center gap-2 text-[11px] font-black text-[#f43f5e] tabular-nums bg-white px-2 py-1 border border-[#fef2f2] shadow-sm">
                                                        <Heart size={12} /> {p.likes_count}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 bg-[#f0f0f0] border-4 border-dashed border-[#c0c0c0] flex flex-col items-center text-center">
                                <BarChart2 size={48} className="text-[#7ea7ff]/20 mb-6" />
                                <p className="max-w-lg text-[#8d92b3] text-[10px] font-bold leading-relaxed uppercase tracking-[0.2em]">
                                    Notice: The data visualizer provides real-time parity with the master registry. High-fidelity archival hardcopies are available via the <span className="text-[#2b2f5a] font-black underline decoration-2 underline-offset-4">EXPORT_HARDCOPY</span> directive in the system header.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
