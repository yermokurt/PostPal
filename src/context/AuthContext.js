// src/context/AuthContext.js — Global auth state management
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// AuthProvider wraps the app to provide user session state
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, restore session from localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem('postpal_token');
        const savedUser = localStorage.getItem('postpal_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // Save session to localStorage and state
    function login(userData, jwtToken) {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('postpal_token', jwtToken);
        localStorage.setItem('postpal_user', JSON.stringify(userData));
    }

    // Update user session data (used after profile edit)
    function updateUser(userData, jwtToken) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('postpal_user', JSON.stringify(updatedUser));

        if (jwtToken) {
            setToken(jwtToken);
            localStorage.setItem('postpal_token', jwtToken);
        }
    }

    // Clear session
    function logout() {
        setUser(null);
        setToken(null);
        localStorage.removeItem('postpal_token');
        localStorage.removeItem('postpal_user');
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for easy access to auth context
export function useAuth() {
    return useContext(AuthContext);
}
