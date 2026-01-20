import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/admin/login', { password });
            if (res.data.success) {
                localStorage.setItem('adminAuth', 'true');
                navigate('/admin/dashboard');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'Access Denied',
                    text: 'Invalid Password',
                    background: '#1e293b',
                    color: '#fff'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Error',
                    text: error.message === 'Network Error' ? 'Cannot connect to server. Is the backend running?' : (error.response?.data?.message || 'Something went wrong'),
                    background: '#1e293b',
                    color: '#fff'
                });
            }
        }
    };

    return (
        <div className="glass-card" style={{ maxWidth: '400px', margin: '100px auto' }}>
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="password"
                    className="input-field"
                    placeholder="Enter Admin Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
            </form>
        </div>
    );
};

export default Login;
