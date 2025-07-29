
// components/Auth.js
'use client';

import React from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';

// --- Estilos ---
const authContainerStyle = {
    padding: '15px 20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    marginBottom: '20px',
};

const buttonStyle = {
    padding: '12px 24px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#4285F4',
    backgroundImage: 'linear-gradient(to bottom, #4285F4, #357ae8)',
    color: 'white',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.2s, box-shadow 0.2s',
};

const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
};

const userTextStyle = {
    color: '#333',
    fontSize: '14px',
};

const logoutButtonStyle = {
    padding: '8px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    borderRadius: '5px',
    border: '1px solid #ccc',
    backgroundColor: '#f8f8f8',
};

export default function Auth({ user, setUser }) {
    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            toast.success('¡Sesión cerrada correctamente!');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <div style={authContainerStyle}>
            {user ? (
                <div style={userInfoStyle}>
                    <p style={userTextStyle}>
                        Sesión iniciada como: <strong>{user.displayName || user.email}</strong>
                    </p>
                    <button onClick={handleLogout} style={logoutButtonStyle}>Cerrar Sesión</button>
                </div>
            ) : (
                <div>
                    <p style={{color: '#555', margin: '0 0 15px 0'}}>Para votar, por favor inicia sesión con tu cuenta de Google.</p>
                    <button 
                        onClick={handleLogin} 
                        style={buttonStyle}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.03)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 18 18" width="20"><path d="M17.64 9.20455c0-.63864-.05727-1.25182-.16364-1.84091H9v3.48182h4.84364c-.20818 1.125-.84273 2.07818-1.77727 2.72182v2.25909h2.90818c1.70182-1.56682 2.68364-3.87409 2.68364-6.62182z" fill="#fff"></path><path d="M9 18c2.43 0 4.46727-.80545 5.95636-2.18182l-2.90818-2.25909c-.80545.54455-1.82273.86182-3.04818.86182-2.34545 0-4.32273-1.58318-5.03591-3.71045H.957273v2.33182C2.43818 16.22318 5.48182 18 9 18z" fill="#34A853"></path><path d="M3.96409 10.71c-.18273-.54455-.285-.12273-.285-1.71s.10227-1.16545.285-1.71V4.95818H.957273C.347727 6.17318 0 7.54773 0 9s.347727 2.82682.957273 4.04182l3.00682-2.33182z" fill="#FBBC05"></path><path d="M9 3.57818c1.32182 0 2.50727.45545 3.44 1.34818l2.58182-2.58182C13.4636.891818 11.43 0 9 0 5.48182 0 2.43818 1.77682.957273 4.95818l3.00682 2.33182C4.67727 5.16136 6.65455 3.57818 9 3.57818z" fill="#EA4335"></path></svg>
                        <span>Iniciar Sesión con Google</span>
                    </button>
                </div>
            )}
        </div>
    );
}