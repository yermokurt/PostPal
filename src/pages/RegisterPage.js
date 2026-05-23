/**
 * RegisterPage.js
 * 
 * HOW THIS WORKS:
 * 1. This page allows new users to join the platform.
 * 2. It checks if passwords match and if the password is long enough.
 * 3. It then sends a POST request to the API to save the new user in storage.json.
 * 4. Once successful, it automatically takes the user to the Login page.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/json';
import { User, Mail, Lock, UserPlus, Newspaper } from 'lucide-react';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '',gender: '', age: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
        if (form.password.length < 6) return setError('Password must be at least 6 characters.');

        setLoading(true);
        try {
            await API.post('/register', { username: form.username,gender:form.gender , age:form.age, email: form.email, password: form.password });
            setSuccess('Account created! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) { setError(err.message || 'Registration failed.'); }
        finally { setLoading(false); }
    }

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 animate-fade-in relative z-10 w-full pb-24">
            <div className="w-full max-w-lg">

                {/* Registration Window */}
                <div className="retro-window shadow-2xl">
                    <div className="window-header">
                        <div className="flex items-center gap-2">
                            <UserPlus size={14} className="text-white/80" />
                            <span className="window-title">Register</span>
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
                            <p className="text-[#8d92b3] text-[10px] font-black uppercase tracking-[0.4em]">Create Account</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-6 bg-[#fef2f2] border-2 border-[#fecaca] text-[#991b1b] text-sm font-black uppercase tracking-tight animate-pulse flex items-center gap-3">
                                <div className="p-2 bg-[#991b1b] text-white">
                                    <Lock size={14} />
                                </div>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-8 p-6 bg-[#ecfdf5] border-2 border-[#a7f3d0] text-[#065f46] text-sm font-black uppercase tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-[#065f46] text-white">
                                    <UserPlus size={14} />
                                </div>
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <InputField icon={<User size={18} />} label="Username" name="username" value={form.username} onChange={handleChange} placeholder="your_username" />
                            <InputField icon={<Mail size={18} />} label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your.email@example.com" />
                            <div>
                                <label className="block text-sm font-bold text-[#5f6487] mb-2 ml-1">Gender</label>
                                <div className="flex gap-6 relative p-4 rounded-lg border-2 border-[#e2e8f0] bg-[#f8fafc]">
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#5f6487] cursor-pointer">
                                        <input type="radio" name="gender" value="Male" checked={form.gender === 'Male'} onChange={handleChange} required className="accent-[#7ea7ff] w-4 h-4 cursor-pointer" />
                                        Male
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#5f6487] cursor-pointer">
                                        <input type="radio" name="gender" value="Female" checked={form.gender === 'Female'} onChange={handleChange} required className="accent-[#7ea7ff] w-4 h-4 cursor-pointer" />
                                        Female
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#5f6487] cursor-pointer">
                                        <input type="radio" name="gender" value="Other" checked={form.gender === 'Other'} onChange={handleChange} required className="accent-[#7ea7ff] w-4 h-4 cursor-pointer" />
                                        Other
                                    </label>
                                </div>
                            </div>
                            <InputField icon={<Mail size={18} />} label="Age" name="age" type="number" value={form.age} onChange={handleChange} placeholder="20" />
                            <InputField icon={<Lock size={18} />} label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
                            <InputField icon={<Lock size={18} />} label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" />

                            <button
                                type="submit" disabled={loading}
                                className="neumo-button w-full flex items-center justify-center gap-3 text-sm py-5 !rounded-none !bg-[#2b2f5a] !text-white shadow-[6px_6px_0px_#7ea7ff] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                            >
                                <UserPlus size={20} />
                                <span className="font-black uppercase tracking-widest">
                                    {loading ? 'CREATING ACCOUNT...' : 'REGISTER NOW'}
                                </span>
                            </button>
                        </form>

                        <div className="mt-12 pt-8 border-t-2 border-[#f0f0f0] text-center">
                            <p className="text-[10px] text-[#8d92b3] font-black uppercase tracking-widest">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[#7ea7ff] hover:text-[#6c95f5] underline transition-colors decoration-2 underline-offset-4">
                                    Login here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* System info tag */}
                <div className="mt-8 flex justify-between px-2 text-[9px] font-black text-[#8d92b3] uppercase tracking-[0.3em] opacity-60">
                    <span>BUILD_ID: PP_RC_2.0</span>
                    <span>KERNEL: v2.0.48-STABLE</span>
                </div>
            </div>
        </div>
    );
}

function InputField({ icon, label, name, type = 'text', value, onChange, placeholder }) {
    return (
        <div>
            <label className="block text-sm font-bold text-[#5f6487] mb-2 ml-1">{label}</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d92b3]">{icon}</span>
                <input
                    type={type} name={name} value={value} onChange={onChange} required placeholder={placeholder}
                    className="w-full neumo-input pl-12"
                />
            </div>
        </div>
    );
}
