/**
 * UserManagementPage.js
 * 
 * HOW THIS WORKS:
 * 1. This page is for Admins only.
 * 2. it lists all registered users and allows the Admin to "Activate" or "Deactivate" them.
 * 3. It includes a search bar to find users by name or email.
 * 4. It also provides filtering to see only Active or Deactivated users.
 */

import React, { useState, useEffect } from 'react';
import API from '../api/json';
import { Users, Search, Filter, Shield, ShieldOff, UserCheck, UserX, Clock } from 'lucide-react';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await API.get('/users');
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }

    async function toggleUserStatus(userId, currentStatus) {
        const newStatus = currentStatus === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
        const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

        if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) return;

        try {
            await API.patch(`/users/${userId}`, { status: newStatus });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        } catch (err) {
            alert('Failed to update user status.');
        }
    }

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = statusFilter === 'ALL' ||
            (statusFilter === 'ACTIVE' && u.status !== 'DEACTIVATED') ||
            (statusFilter === 'DEACTIVATED' && u.status === 'DEACTIVATED');
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in space-y-12 pb-24">

            {/* Control Center Window */}
            <div className="retro-window">
                <div className="window-header">
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-white/80" />
                        <span className="window-title">User Registry & Access Control</span>
                    </div>
                    <div className="window-controls">
                        <div className="control-btn">—</div>
                        <div className="control-btn">□</div>
                        <div className="control-btn text-red-500">X</div>
                    </div>
                </div>

                <div className="p-10 bg-[#fdfdfd]">
                    <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b-2 border-[#f0f0f0]">
                        <div className="flex-1">
                            <h1 className="text-4xl font-black tracking-tighter text-[#2b2f5a] uppercase mb-2">User Management</h1>
                            <div className="flex items-center gap-4">
                                <p className="text-[#8d92b3] text-[10px] font-black uppercase tracking-[0.3em]">Access Monitor: Online</p>
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            </div>

                            {/* Search Bar */}
                            <div className="mt-8 relative max-w-md">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d92b3]" />
                                <input
                                    type="text"
                                    placeholder="Search by identity or node..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full neumo-input pl-12 pr-6 py-4 text-sm font-bold placeholder:text-[#8d92b3]/50"
                                />
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex flex-col gap-3">
                            <label className="text-[9px] font-black text-[#8d92b3] uppercase tracking-widest ml-1">Filter_Protocol</label>
                            <div className="flex bg-[#f0f0f0] border-2 border-[#c0c0c0] p-1 shadow-inner">
                                {['ALL', 'ACTIVE', 'DEACTIVATED'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setStatusFilter(f)}
                                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f
                                            ? 'bg-[#2b2f5a] text-white shadow-[2px_2px_0px_#7ea7ff]'
                                            : 'text-[#8d92b3] hover:text-[#5f6487]'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-32 text-center animate-pulse">
                            <Users size={48} className="mx-auto mb-6 text-[#7ea7ff]/20" />
                            <p className="text-[#8d92b3] font-black uppercase tracking-[0.2em]">Syncing Master User List...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-24 text-center bg-[#f0f0f0] border-4 border-dashed border-[#c0c0c0]">
                            <Search size={64} className="mx-auto mb-6 text-[#7ea7ff]/10" />
                            <p className="text-[10px] font-black text-[#2b2f5a] uppercase tracking-[0.3em]">No subjects matched your query</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    className={`bg-white border-2 p-8 group relative transition-all ${u.status === 'DEACTIVATED'
                                        ? 'border-[#fecaca] bg-[#fffafb] grayscale-[0.5]'
                                        : 'border-[#e8ebf5] hover:border-[#7ea7ff] hover:shadow-[8px_8px_0px_#7ea7ff08]'}`}
                                >
                                    {/* Status Badge */}
                                    <div className={`absolute top-0 right-0 px-4 py-1 text-[8px] font-black uppercase tracking-widest border-b-2 border-l-2 ${u.status === 'DEACTIVATED'
                                        ? 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]'
                                        : 'bg-[#ecfdf5] text-[#059669] border-[#e8ebf5]'}`}>
                                        {u.status === 'DEACTIVATED' ? 'OFFLINE / BANNED' : 'ONLINE / ACTIVE'}
                                    </div>

                                    <div className="flex items-start gap-6">
                                        {/* Avatar */}
                                        <div className={`w-16 h-16 border-4 flex items-center justify-center text-2xl font-black shrink-0 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] ${u.status === 'DEACTIVATED' ? 'bg-[#fbe3e3] border-[#b25a5a] text-[#b25a5a]' : 'bg-white border-[#2b2f5a] text-[#7ea7ff]'}`}>
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-[#2b2f5a] uppercase tracking-tighter truncate">{u.username}</h3>
                                                {u.role === 'admin' && (
                                                    <Shield size={14} className="text-[#7ea7ff]" />
                                                )}
                                            </div>
                                            <p className="text-xs font-medium text-[#8d92b3] mb-4 truncate">{u.email}</p>

                                            <div className="flex items-center gap-4 text-[9px] font-black text-[#5f6487] uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Clock size={12} /> Joined {new Date(u.created_at || Date.now()).toLocaleDateString()}</span>
                                                <span className="px-2 py-0.5 bg-[#f0f0f0] border border-[#c0c0c0]">{u.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {u.role !== 'admin' && (
                                        <div className="mt-8 pt-6 border-t border-[#f0f0f0]">
                                            <button
                                                onClick={() => toggleUserStatus(u.id, u.status)}
                                                className={`w-full py-3 px-6 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${u.status === 'DEACTIVATED'
                                                    ? 'bg-[#ecfdf5] text-[#059669] border-2 border-[#059669] shadow-[4px_4px_0px_#05966930] hover:bg-[#059669] hover:text-white'
                                                    : 'bg-[#fef2f2] text-[#dc2626] border-2 border-[#dc2626] shadow-[4px_4px_0px_#dc262630] hover:bg-[#dc2626] hover:text-white'}`}
                                            >
                                                {u.status === 'DEACTIVATED' ? (
                                                    <> <UserCheck size={16} /> Activate </>
                                                ) : (
                                                    <> <UserX size={16} /> Deactivate </>
                                                )}
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
