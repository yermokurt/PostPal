/**
 * LoginPage.js
 * 
 * HOW THIS WORKS:
 * 1. This page handles user authentication.
 * 2. When the user clicks "Login", we send their email and password to the API helper.
 * 3. If the server finds a match in storage.json, it returns the user's data.
 * 4. We then save that user in our "AuthContext" so the whole app knows who is logged in.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/json';
import { Mail, Lock, LogIn, Newspaper } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await API.post('/login', form);
            const { token, user } = res.data;
            login(user, token);

            if (user.role === 'admin') navigate('/admin/moderation');
            else navigate('/');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            const detail = err.response?.data?.detail;
            setError(detail ? `${msg} — ${detail}` : msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 animate-fade-in relative z-10 w-full pb-24">
            <div className="w-full max-w-lg">

                {/* Auth Window */}
                <div className="retro-window shadow-2xl">
                    <div className="window-header">
                        <div className="flex items-center gap-2">
                            <Lock size={14} className="text-white/80" />
                            <span className="window-title">Login</span>
                        </div>
                        <div className="window-controls">
                            <div className="control-btn">—</div>
                            <div className="control-btn">□</div>
                            <div className="control-btn text-red-500">X</div>
                        </div>
                    </div>

                    <div className="p-10 bg-[#fdfdfd]">
                        <div className="text-center mb-10 pb-8 border-b-2 border-[#f0f0f0]">
                            <div className="inline-flex items-center gap-4 text-[#2b2f5a] font-black text-5xl mb-3 tracking-tighter uppercase">
                                <Newspaper size={44} className="text-[#7ea7ff]" /> PostPal
                            </div>
                            <p className="text-[#8d92b3] text-[10px] font-black uppercase tracking-[0.4em]">Welcome Back</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-6 bg-[#fef2f2] border-2 border-[#fecaca] text-[#991b1b] text-sm font-black uppercase tracking-tight animate-pulse flex items-center gap-3">
                                <div className="p-2 bg-[#991b1b] text-white">
                                    <Lock size={14} />
                                </div>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#f0f0f0] border-r-2 border-[#c0c0c0] flex items-center justify-center text-[#8d92b3]">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email" name="email" value={form.email} onChange={handleChange} required placeholder="your.email@example.com"
                                        className="w-full neumo-input pl-16 !rounded-none border-2 border-[#c0c0c0] bg-white focus:border-[#7ea7ff] transition-colors font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8d92b3] uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
                                <div className="relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#f0f0f0] border-r-2 border-[#c0c0c0] flex items-center justify-center text-[#8d92b3]">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••"
                                        className="w-full neumo-input pl-16 !rounded-none border-2 border-[#c0c0c0] bg-white focus:border-[#7ea7ff] transition-colors font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="neumo-button w-full flex items-center justify-center gap-3 text-sm py-5 !rounded-none !bg-[#2b2f5a] !text-white shadow-[6px_6px_0px_#7ea7ff] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                            >
                                <LogIn size={20} />
                                <span className="font-black uppercase tracking-widest">
                                    {loading ? 'AUTHENTICATING...' : 'LOGIN NOW'}
                                </span>
                            </button>
                        </form>

                        <div className="mt-12 pt-8 border-t-2 border-[#f0f0f0] text-center">
                            <p className="text-[10px] text-[#8d92b3] font-black uppercase tracking-widest">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-[#7ea7ff] hover:text-[#6c95f5] underline transition-colors decoration-2 underline-offset-4">
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* System info tag */}
                <div className="mt-8 flex justify-between px-2 text-[9px] font-black text-[#8d92b3] uppercase tracking-[0.3em] opacity-60">
                    <span>ITELECT3 POST PAL</span>
                    <span>FINAL PROJECT</span>
                </div>
            </div>
        </div>
    );
}
