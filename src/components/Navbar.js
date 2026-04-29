/**
 * Navbar.js
 * 
 * HOW THIS WORKS:
 * 1. This is the navigation bar at the top of every page.
 * 2. It checks the "user" state to decide which buttons to show (e.g., Login vs Logout).
 * 3. It also has a built-in clock that updates every second!
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, PenSquare, LayoutDashboard, Flag, Newspaper, Monitor, Clock as ClockIcon, Shield, Users } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <nav className="relative z-[100] p-1.5 bg-[#c0c0c0]/95 backdrop-blur-sm border-2 border-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15),inset_1px_1px_0_px_#ffffff,2px_2px_0_1px_#808080] w-full max-w-[1400px] animate-slide-down">
            <div className="flex items-center justify-between h-12 px-4">

                {/* Left Side: Start & Quick Links */}
                <div className="flex items-center gap-2">
                    <Link to="/" className={`flex items-center gap-2 px-5 h-10 font-black uppercase text-[#2b2f5a] text-[11px] tracking-[0.2em] transition-all border-2 ${location.pathname === '/' ? 'bg-[#d0d0d0] border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_0_#00000040] translate-x-[1px] translate-y-[1px]' : 'bg-[#c0c0c0] border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[2px_2px_0_0_#00000040] hover:bg-[#d0d0d0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}>
                        <Monitor size={16} />
                        <span>Start</span>
                    </Link>

                    <div className="w-[2px] h-8 bg-[#808080] border-r border-white mx-1" />

                    {user && (
                        <div className="flex items-center gap-2">
                            <IconButton to="/" icon={<Newspaper size={18} />} label="Wall" active={location.pathname === '/'} />
                            <IconButton to="/create" icon={<PenSquare size={18} />} label="Post" active={location.pathname === '/create'} />

                            {user.role === 'admin' && (
                                <>
                                    <IconButton to="/admin/moderation" icon={<Shield size={18} />} label="Mod" active={location.pathname === '/admin/moderation'} />
                                    <IconButton to="/admin/users" icon={<Users size={18} />} label="Users" active={location.pathname === '/admin/users'} />
                                    <IconButton to="/admin/reports" icon={<Flag size={18} />} label="Reports" active={location.pathname === '/admin/reports'} />
                                    <IconButton to="/admin/analytics" icon={<LayoutDashboard size={18} />} label="Analytics" active={location.pathname === '/admin/analytics'} />
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Identity & System Tray */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link to="/profile" className={`flex items-center gap-2 px-3 h-10 border-2 border-white shadow-[1px_1px_0_1px_#404040] hover:bg-[#d0d0d0] transition-all bg-[#c0c0c0] ${location.pathname === '/profile' ? 'shadow-inner bg-[#d8d8d8]' : ''}`}>
                                <div className="w-6 h-6 rounded-sm overflow-hidden border border-[#808080] bg-white">
                                    {user.profile_picture ? (
                                        <img src={user.profile_picture_url || user.profile_picture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#7ea7ff]">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-[#2b2f5a] hidden sm:block">{user.username}</span>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="p-2 h-10 border-2 border-white shadow-[1px_1px_0_1px_#404040] bg-[#c0c0c0] hover:bg-[#fbe3e3] hover:text-[#b25a5a] transition-all"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="px-4 py-1 h-10 border-2 border-white shadow-[1px_1px_0_1px_#404040] bg-[#c0c0c0] font-bold text-xs uppercase flex items-center hover:bg-white transition-all">Sign In</Link>
                            <Link to="/register" className="px-4 py-1 h-10 border-2 border-white shadow-[1px_1px_0_1px_#404040] bg-[#7ea7ff] text-white font-bold text-xs uppercase flex items-center hover:opacity-90 transition-all">Join</Link>
                        </div>
                    )}

                    {/* System Clock Tray */}
                    <div className="flex items-center gap-2 px-3 h-10 border-2 border-[#808080] shadow-[inset_1px_1px_2px_#404040] bg-[#d8d8d8] min-w-[100px] justify-center">
                        <ClockIcon size={14} className="text-[#5f6487]" />
                        <span className="text-xs font-black text-[#2b2f5a] tabular-nums tracking-tighter">{formatTime(time)}</span>
                    </div>
                </div>
            </div>
        </nav>
    );
}

function IconButton({ to, icon, label, active }) {
    return (
        <Link
            to={to}
            className={`group relative flex items-center justify-center w-10 h-10 border-2 border-white shadow-[1px_1px_0_1px_#404040] hover:bg-[#d0d0d0] active:shadow-inner transition-all ${active ? 'bg-[#d8d8d8] shadow-inner' : 'bg-[#c0c0c0]'}`}
            title={label}
        >
            <div className="text-[#2b2f5a] group-hover:scale-110 transition-transform">
                {icon}
            </div>
            {/* Tooltip on Top */}
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#2b2f5a] text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white z-[110] shadow-[3px_3px_0_rgba(0,0,0,0.2)]">
                {label}
            </div>
        </Link>
    );
}
