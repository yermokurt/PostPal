import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/json';
import { ImagePlus, Send, X, PenSquare } from 'lucide-react';

const CATEGORIES = ['News', 'Education', 'Gaming', 'Life', 'Wellness', 'Others'];

export default function CreatePostPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [form, setForm] = useState({ topic: 'News', content: '', is_anonymous: false });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    }

    function handleImageChange(e) {
        const file = e.target.files[0];
        if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
    }

    function removeImage() { setImage(null); setPreview(null); }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const newPostData = {
            topic: form.topic,
            content: form.content,
            is_anonymous: form.is_anonymous,
            username: user?.username || "Guest", // Uses your actual logged-in name!
            created_at: new Date().toISOString(),
            likes_count: 0,
            comment_count: 0,
            status: 'APPROVED'
        };

        try {
            await API.post('/posts', newPostData);
            setSuccess("Post shared successfully!");
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setError('Failed to create post.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in pb-24">

            <div className="retro-window">
                <div className="window-header">
                    <div className="flex items-center gap-2">
                        <PenSquare size={14} className="text-white/80" />
                        <span className="window-title">Create New Post</span>
                    </div>
                    <div className="window-controls">
                        <div className="control-btn">—</div>
                        <div className="control-btn">□</div>
                        <button onClick={() => navigate('/')} className="control-btn text-red-500 hover:bg-red-500 hover:text-white transition-colors">X</button>
                    </div>
                </div>

                <div className="p-8 sm:p-10 bg-[#fdfdfd] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#eef3ff] rounded-full blur-[80px] opacity-30 -z-10" />

                    {error && (
                        <div className="mb-8 p-4 bg-[#fbe3e3] border-2 border-[#b25a5a] text-[#b25a5a] text-xs font-black uppercase tracking-widest shadow-sm animate-pulse">
                            [ERROR]: {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-8 p-4 bg-[#eef3ff] border-2 border-[#7ea7ff] text-[#5f6487] text-xs font-black uppercase tracking-widest shadow-sm">
                            [SUCCESS]: {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Category Selection */}
                        <div>
                            <label className="block text-[10px] font-black text-[#8d92b3] mb-4 uppercase tracking-[0.2em] ml-1">Select Topic</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setForm({ ...form, topic: c })}
                                        className={`px-5 py-2.5 text-xs font-black transition-all border-2 border-white shadow-[2px_2px_0_1px_#404040] active:shadow-inner active:translate-y-0.5 ${form.topic === c
                                            ? 'bg-[#7ea7ff] text-white shadow-inner translate-y-0.5'
                                            : 'bg-[#c0c0c0] text-[#2b2f5a] hover:bg-[#d0d0d0]'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-[10px] font-black text-[#8d92b3] mb-4 uppercase tracking-[0.2em] ml-1">Post Content</label>
                            <div className="relative">
                                <textarea
                                    name="content"
                                    value={form.content}
                                    onChange={handleChange}
                                    required
                                    rows={8}
                                    placeholder="Share your thoughts"
                                    className="w-full neumo-input p-5 min-h-[220px] text-lg font-medium tracking-tight bg-white border-4 border-[#c0c0c0] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] focus:border-[#7ea7ff] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Image Upload Area */}
                        <div>
                            <label className="block text-[10px] font-black text-[#8d92b3] mb-4 uppercase tracking-[0.2em] ml-1">Attachment (Optional)</label>
                            {!preview ? (
                                <label className="flex flex-col items-center justify-center gap-4 cursor-pointer w-full h-44 border-4 border-dashed border-[#c0c0c0] bg-[#f0f0f0] hover:border-[#7ea7ff] hover:bg-white transition-all group">
                                    <div className="hybrid-icon group-hover:scale-110 transition-transform">
                                        <ImagePlus size={24} className="text-[#2b2f5a]" />
                                    </div>
                                    <span className="text-[10px] font-black text-[#8d92b3] uppercase tracking-widest">Upload Image</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            ) : (
                                <div className="relative group border-4 border-[#c0c0c0] shadow-sm bg-black overflow-hidden">
                                    <img src={preview} alt="Preview" className="w-full h-72 object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="control-btn !w-10 !h-10 !bg-[#fbe3e3] !border-[#b25a5a] text-[#b25a5a]"
                                            title="Discard Archive"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-10 border-t-2 border-[#f0f0f0]">
                            {/* Anonymous Toggle */}
                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" name="is_anonymous" checked={form.is_anonymous} onChange={handleChange} className="sr-only" />
                                    <div className={`w-14 h-7 border-2 border-white shadow-[1px_1px_0_1px_#404040] transition-all duration-300 flex items-center ${form.is_anonymous ? 'bg-[#7ea7ff]' : 'bg-[#c0c0c0]'}`}>
                                        <div className={`w-5 h-5 bg-white border border-[#808080] shadow-sm ml-0.5 transition-transform duration-300 ${form.is_anonymous ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-xs font-black text-[#2b2f5a] uppercase tracking-tighter group-hover:text-[#7ea7ff] transition">Anonymous Mode</span>
                                    <span className="text-[9px] font-bold text-[#8d92b3] uppercase">Status: {form.is_anonymous ? 'ON' : 'OFF'}</span>
                                </div>
                            </label>

                            <button
                                type="submit"
                                disabled={loading}
                                className="neumo-button px-12 py-5 text-sm flex items-center gap-4 !rounded-none border-2 border-[#2b2f5a] bg-white hover:bg-[#2b2f5a] hover:text-white transition-all shadow-[6px_6px_0_0_#2b2f5a] active:shadow-none active:translate-x-1 active:translate-y-1"
                            >
                                <Send size={20} />
                                <span className="tracking-[0.2em] font-black uppercase">{loading ? 'PUBLISHING...' : 'PUBLISH POST'}</span>
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
