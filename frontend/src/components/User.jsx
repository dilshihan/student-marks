import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const User = () => {
    const [search, setSearch] = useState({ registerNumber: '', name: '' });
    const [results, setResults] = useState(null);

    const handleChange = (e) => {
        setSearch({ ...search, [e.target.name]: e.target.value });
    };

    const handleCheck = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/user/check-mark', search);
            if (res.data.found) {
                setResults(res.data.data);
            } else {
                setResults(null);
                Swal.fire({
                    icon: 'error',
                    title: 'Not Found',
                    text: 'Student not found with provided details'
                });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong' });
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="glass-card">
                <h2>Check Result</h2>
                <form onSubmit={handleCheck}>
                    <input
                        className="input-field"
                        name="registerNumber"
                        placeholder="Register Number"
                        value={search.registerNumber}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="input-field"
                        name="name"
                        placeholder="Student Name"
                        value={search.name}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Check Results</button>
                </form>
            </div>

            {results && results.map((record, idx) => (
                <div key={idx} className="glass-card" style={{ marginTop: '2rem', textAlign: 'left', borderTop: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.75rem' }}>{record.name}</h3>
                            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>Reg: {record.registerNumber}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ background: 'rgba(6, 78, 59, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold' }}>
                                {record.examType}
                            </span>
                            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>Class: {record.className}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th style={{ textAlign: 'right' }}>Mark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {record.subjects.map((sub, sIdx) => (
                                <tr key={sIdx}>
                                    <td>{sub.subjectName}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{sub.mark}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default User;
