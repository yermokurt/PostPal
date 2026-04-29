// src/pages/ProfilePage.js — User Profile
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/json';
import { Heart, FileText, Clock, Activity, Edit3, Save, User, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProfilePage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0 });
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false); // New state to control visibility

    useEffect(() => { fetchUserData(); }, []);

    async function fetchUserData() {
        try {
            const res = await API.get('/posts/user');
            // Ensure we always have an array, even if the server returns an error or empty object
            const userPosts = Array.isArray(res.data) ? res.data : [];
            setPosts(userPosts);

            const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
            setStats({ totalPosts: userPosts.length, totalLikes });
        } catch (err) {
            console.error('Failed to load profile:', err);
            setPosts([]); // Fallback to empty array on error
        } finally {
            setLoading(false);
        }
    }

    function handleExportPDF() {
        if (posts.length === 0) return alert("You don't have any posts to export yet!");
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const generatedDate = new Date().toLocaleString();

        doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.text('PostPal', 14, 16);
        doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text('Personal Analytics Report', 14, 24);
        doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text(`Generated: ${generatedDate}`, 14, 30);

        doc.setTextColor(30, 41, 59); doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text(`User: ${user.username}`, 14, 48);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); const roleText = user.role === 'admin' ? 'Administrator' : 'Community Member';
        doc.text(`Email: ${user.email}   |   Role: ${roleText}`, 14, 55);

        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Total Performance', 14, 70);
        autoTable(doc, {
            startY: 74, head: [['Metric', 'Value']], body: [['Total Posts Created', stats.totalPosts], ['Total Likes Received', stats.totalLikes]],
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { halign: 'center' } }, margin: { left: 14, right: 14 }, theme: 'grid'
        });

        const categoryStats = posts.reduce((acc, p) => {
            if (!acc[p.topic]) acc[p.topic] = { count: 0, likes: 0 };
            acc[p.topic].count++; acc[p.topic].likes += p.likes_count || 0; return acc;
        }, {});
        const catData = Object.entries(categoryStats).map(([topic, data]) => [topic, data.count, data.likes]).sort((a, b) => b[2] - a[2]);

        const afterSummary = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Performance by Category', 14, afterSummary);
        autoTable(doc, {
            startY: afterSummary + 4, head: [['Category', 'Posts Authored', 'Likes Received']], body: catData,
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } }, margin: { left: 14, right: 14 }, theme: 'grid'
        });

        doc.addPage(); doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text(`PostPal — Post History for ${user.username}`, 14, 13);
        doc.setTextColor(30, 41, 59); doc.setFontSize(13); doc.text('Detailed Post History', 14, 30);
        autoTable(doc, {
            startY: 34, head: [['#', 'Category', 'Likes', 'Status', 'Date', 'Content Preview']],
            body: posts.map((p, i) => [i + 1, p.topic, p.likes_count, p.status, new Date(p.created_at).toLocaleDateString(), p.content.length > 50 ? p.content.substring(0, 50) + '…' : p.content]),
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 }, bodyStyles: { fontSize: 8 }, alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 25 }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 22, halign: 'center' }, 4: { cellWidth: 22 }, 5: { cellWidth: 'auto' } },
            margin: { left: 14, right: 14 }, theme: 'grid'
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i); doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.text(`PostPal Analytics — Page ${i} of ${pageCount}`, 14, 292); doc.text(`User: ${user.username}`, pageWidth - 14, 292, { align: 'right' });
        }
        const dateStr = new Date().toISOString().slice(0, 10); doc.save(`PostPal_Analytics_${user.username}_${dateStr}.pdf`);
    }

    function handleEditProfile() {
        setIsEditModalOpen(true);
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in space-y-12 pb-24">

            {/* Profile Window */}
            <div className="retro-window">
                <div className="window-header">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-white/80" />
                        <span className="window-title">User Profile</span>
                    </div>
                    <div className="window-controls">
                        <div className="control-btn">—</div>
                        <div className="control-btn">□</div>
                        <div className="control-btn text-red-500">X</div>
                    </div>
                </div>

                <div className="p-8 sm:p-12 bg-[#fdfdfd] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#eef3ff] rounded-full blur-[100px] opacity-20 -z-10" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-10 pb-10 border-b-2 border-[#f0f0f0]">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="w-40 h-40 bg-white border-4 border-[#2b2f5a] shadow-[6px_6px_0px_#7ea7ff] flex items-center justify-center text-[#7ea7ff] text-5xl font-black shrink-0 overflow-hidden">
                                {user?.profile_picture ? (
                                    <img
                                        src={user.profile_picture_url || user.profile_picture}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="drop-shadow-sm">{user?.username?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="text-center md:text-left">
                                <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                                    <h2 className="text-5xl font-black tracking-tighter text-[#2b2f5a] uppercase">{user?.username}</h2>
                                    {user?.role === 'admin' && (
                                        <span className="bg-[#2b2f5a] text-white text-[9px] px-3 py-1 rounded-sm font-black uppercase tracking-[0.2em] border border-white/20">
                                            Admin
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[#8d92b3] text-[10px] font-black uppercase tracking-[0.3em]">Verified Member</p>
                                    <p className="text-[#5f6487] font-bold tracking-tight">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleEditProfile}
                                    className="neumo-button px-6 py-3 mt-6 flex items-center gap-3 text-xs !rounded-none border-2 border-[#2b2f5a] bg-white hover:bg-[#7ea7ff] hover:text-white transition-all shadow-[4px_4px_0_0_#2b2f5a]"
                                >
                                    <Edit3 size={16} /> Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                        <div className="bg-white border-2 border-[#c0c0c0] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)] px-6 py-4 flex justify-between items-center group hover:border-[#7ea7ff] transition-colors">
                            <span className="text-[10px] font-black text-[#8d92b3] uppercase tracking-widest">Username</span>
                            <span className="text-xs font-black text-[#2b2f5a] uppercase">{user?.username}</span>
                        </div>
                        <div className="bg-white border-2 border-[#c0c0c0] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)] px-6 py-4 flex justify-between items-center group hover:border-[#7ea7ff] transition-colors">
                            <span className="text-[10px] font-black text-[#8d92b3] uppercase tracking-widest">Email Address</span>
                            <span className="text-xs font-black text-[#2b2f5a] lowercase opacity-70">{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diagnostics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="retro-window">
                    <div className="window-header !bg-[#f0f0f0] border-b border-[#c0c0c0]">
                        <span className="window-title !text-[#f0f0f0] !text-shadow-none">Post Stats</span>
                    </div>
                    <div className="p-8 bg-white flex flex-col items-center">
                        <div className="hybrid-icon mb-6 bg-[#eef3ff]">
                            <FileText size={24} className="text-[#7ea7ff]" />
                        </div>
                        <div className="text-5xl font-black text-[#2b2f5a] mb-1 tabular-nums">{stats.totalPosts}</div>
                        <div className="text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.2em]">Posts Authored</div>
                    </div>
                </div>

                <div className="retro-window">
                    <div className="window-header !bg-[#f0f0f0] border-b border-[#c0c0c0]">
                        <span className="window-title !text-[#f0f0f0] !text-shadow-none">Engagement</span>
                    </div>
                    <div className="p-8 bg-white flex flex-col items-center">
                        <div className="hybrid-icon mb-6 bg-[#fbe3e3]">
                            <Heart size={24} className="text-[#b25a5a]" />
                        </div>
                        <div className="text-5xl font-black text-[#2b2f5a] mb-1 tabular-nums">{stats.totalLikes}</div>
                        <div className="text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.2em]">Likes Received</div>
                    </div>
                </div>

                <div className="retro-window flex flex-col">
                    <div className="window-header !bg-[#f0f0f0] border-b border-[#c0c0c0]">
                        <span className="window-title !text-[#f0f0f0] !text-shadow-none">Analytics Engine</span>
                    </div>
                    <div className="p-8 bg-white flex-1 flex flex-col items-center justify-center">
                        <div className="hybrid-icon mb-6 bg-[#f3f4fa]">
                            <Activity size={24} className="text-[#5f6487]" />
                        </div>
                        <button
                            onClick={handleExportPDF}
                            disabled={loading || posts.length === 0}
                            className={`px-4 py-3 w-full border-2 border-[#2b2f5a] font-black uppercase tracking-[0.2em] text-[10px] transition-all ${loading || posts.length === 0 ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-white text-[#2b2f5a] shadow-[4px_4px_0_0_#2b2f5a] hover:bg-[#7ea7ff] hover:text-white hover:shadow-[4px_4px_0_0_#2b2f5a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'}`}
                        >
                            Export Data
                        </button>
                    </div>
                </div>
            </div>

            {/* File Archive Window */}
            <div className="retro-window">
                <div className="window-header">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-white/80" />
                        <span className="window-title">My Post History</span>
                    </div>
                    <div className="window-controls">
                        <div className="control-btn">—</div>
                        <div className="control-btn">□</div>
                    </div>
                </div>

                <div className="p-8 bg-[#fdfdfd]">
                    {loading ? (
                        <div className="py-20 text-center animate-pulse text-[#8d92b3] font-black uppercase tracking-[0.2em]">Resuming...</div>
                    ) : !showHistory ? (
                        <div className="py-20 text-center border-4 border-dashed border-[#c0c0c0] bg-[#f8f9ff]">
                            <FileText size={48} className="mx-auto text-[#7ea7ff]/20 mb-6" />
                            <p className="text-[10px] font-black text-[#2b2f5a] uppercase tracking-[0.3em] mb-6">Archive Protected</p>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="neumo-button px-8 py-4 bg-[#2b2f5a] text-white font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0_0_#7ea7ff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                            >
                                Fetch History
                            </button>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="py-20 text-center bg-[#f0f0f0] border-4 border-dashed border-[#c0c0c0]">
                            <Clock size={48} className="mx-auto text-[#8d92b3]/20 mb-6" />
                            <p className="text-[#8d92b3] font-black text-[10px] uppercase tracking-[0.3em]">No Posts Found</p>
                            <button 
                                onClick={() => setShowHistory(false)} 
                                className="mt-6 px-6 py-2 bg-white border-2 border-[#c0c0c0] text-[9px] font-black text-[#8d92b3] uppercase tracking-widest hover:bg-[#f0f0f0] transition-all"
                            >
                                Close Archive
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[9px] font-black text-[#8d92b3] uppercase tracking-widest">Displaying {posts.length} records</span>
                                <button 
                                    onClick={() => setShowHistory(false)} 
                                    className="px-6 py-2 bg-[#fbe3e3] border-2 border-[#b25a5a] text-[9px] font-black text-[#b25a5a] uppercase tracking-widest hover:bg-[#b25a5a] hover:text-white transition-all shadow-[2px_2px_0_0_#b25a5a] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                                >
                                    Hide Archive
                                </button>
                            </div>
                            {posts.map(post => (
                                <div key={post.id} className="bg-white border-2 border-[#e8ebf5] p-6 hover:border-[#7ea7ff] hover:shadow-[4px_4px_0_0_#7ea7ff15] transition-all group relative">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="text-[10px] font-black text-[#5f6487] px-3 py-1 bg-[#f0f0f0] border border-[#c0c0c0] uppercase tracking-widest group-hover:bg-[#7ea7ff] group-hover:text-white group-hover:border-[#7ea7ff] transition-colors">{post.topic}</div>
                                            <div className={`text-[9px] px-3 py-1 font-black uppercase tracking-[0.1em] border-2 ${post.status === 'APPROVED' ? 'bg-[#ecfdf5] text-[#059669] border-[#059669]/30' :
                                                post.status === 'PENDING' ? 'bg-[#fffbeb] text-[#d97706] border-[#d97706]/30' :
                                                    'bg-[#fef2f2] text-[#dc2626] border-[#dc2626]/30'
                                                }`}>
                                                {post.status}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.2em]">
                                            <Clock size={14} /> {new Date(post.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#fbfbff] border border-[#f0f0f0] shadow-inner mb-4">
                                        <p className="text-[#2b2f5a] font-medium leading-relaxed line-clamp-2">{post.content}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Heart size={14} className="text-[#b25a5a]" />
                                            <span className="text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.1em]">{post.likes_count} Units Received</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeletePost(post.id)}
                                            className="p-2 text-[#b25a5a] hover:bg-[#fbe3e3] border-2 border-transparent hover:border-[#b25a5a] transition-all"
                                            title="Delete permanent record"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Small retro corner detail */}
                                    <div className="absolute top-0 right-0 w-2 h-2 bg-[#808080] opacity-0 group-hover:opacity-20 transition-opacity" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} />
        </div>
    );
}

// Helper: Handle Post Deletion
async function handleDeletePost(postId) {
    if (!window.confirm('PROTOCOL WARNING: Deleting this record is permanent. Proceed?')) return;
    try {
        await API.delete(`/posts/${postId}`);
        window.location.reload(); // Quickest way to refresh stats and history
    } catch (err) { alert('Failed to delete post.'); }
}

// Edit Profile Modal Component
function EditProfileModal({ isOpen, onClose, user }) {
    const { updateUser } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            if (selectedFile) {
                formData.append('profile_picture', selectedFile);
            }

            const res = await API.put('/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            updateUser(res.data.user, res.data.token);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#2b2f5a]/30 backdrop-blur-sm animate-fade-in">
            <div className="retro-window w-full max-w-lg shadow-[10px_10px_30px_rgba(0,0,0,0.2)]">
                {/* Header */}
                <div className="window-header">
                    <div className="flex items-center gap-2">
                        <Edit3 size={14} className="text-white/80" />
                        <span className="window-title">Profile Settings</span>
                    </div>
                    <div className="window-controls">
                        <button onClick={onClose} className="control-btn hover:bg-red-500 hover:text-white transition-colors">X</button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-10 space-y-8 bg-[#fdfdfd]">
                    {error && (
                        <div className="p-3 bg-[#fbe3e3] border-2 border-[#b25a5a] text-[#b25a5a] text-[10px] font-black uppercase tracking-widest shadow-sm">
                            [ERR]: {error}
                        </div>
                    )}

                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-40 h-40 bg-white border-4 border-[#2b2f5a] shadow-[6px_6px_0px_#7ea7ff] flex items-center justify-center text-[#7ea7ff] text-5xl font-black shrink-0 overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : user?.profile_picture ? (
                                    <img src={user.profile_picture_url || user.profile_picture} alt="Current" className="w-full h-full object-cover" />
                                ) : (
                                    user?.username?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 hybrid-icon !w-10 !h-10 cursor-pointer hover:scale-110 transition shadow-lg">
                                <Edit3 size={18} />
                            </label>
                            <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <span className="text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.2em] mt-8">Capture_Identity_Asset</span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.2em] mb-3 ml-1">Archive_Handle</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full neumo-input px-6 py-4 text-[#2b2f5a] font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.2em] mb-3 ml-1">Node_Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full neumo-input px-6 py-4 text-[#2b2f5a] font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-8 border-t-2 border-[#f0f0f0] bg-[#f7f8fc]/50 flex justify-end gap-5">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-8 py-3 text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.2em] hover:text-[#2b2f5a] transition disabled:opacity-50"
                    >
                        HALT_OP
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="neumo-button px-10 py-3 flex items-center gap-3 text-xs !rounded-none border-2 border-[#2b2f5a] bg-white hover:bg-[#7ea7ff] hover:text-white transition-all shadow-[4px_4px_0_0_#2b2f5a]"
                    >
                        {saving ? (
                            <span className="animate-spin h-4 w-4 border-2 border-[#7ea7ff] border-t-transparent rounded-full"></span>
                        ) : (
                            <Save size={18} />
                        )}
                        {saving ? 'COMMITTING...' : 'WRITE_TO_DISK'}
                    </button>
                </div>
            </div>
        </div>
    );
}
