import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const User = () => {
    const [search, setSearch] = useState({ registerNumber: '' });
    const [results, setResults] = useState(null);

    const getGrade = (mark) => {
        const m = Number(mark);
        if (m >= 45) return 'A+';
        if (m >= 40) return 'A';
        if (m >= 35) return 'B+';
        if (m >= 30) return 'B';
        if (m >= 25) return 'C+';
        if (m >= 20) return 'C';
        if (m >= 18) return 'D+';
        return 'D';
    };

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
                    text: 'Student not found with provided register number'
                });
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Something went wrong';
            Swal.fire({ icon: 'error', title: 'Error', text: errorMsg });
        }
    };

    const handleDownload = () => {
        window.print();
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <style>
                {`
                    @media print {
                        body * { visibility: hidden; }
                        #print-section, #print-section * { visibility: visible; }
                        #print-section { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%;
                            padding: 20px;
                        }
                        .no-print { display: none !important; }
                        .glass-card { 
                            border: 1px solid #ddd !important; 
                            box-shadow: none !important; 
                            background: white !important;
                            color: black !important;
                        }
                        .results-table th, .results-table td {
                            border: 1px solid #eee !important;
                        }
                    }
                `}
            </style>
            <div className="glass-card no-print">
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
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Check Results</button>
                </form>
            </div>

            {results && results.map((record, idx) => {
                const totalEarned = record.subjects.reduce((sum, sub) => sum + (Number(sub.mark) || 0), 0);
                const totalMax = record.subjects.length * 50;

                return (
                    <div key={idx} id="print-section" className="glass-card" style={{ marginTop: '2rem', textAlign: 'left', borderTop: '4px solid var(--primary)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem' }}>
                            <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.8rem', textTransform: 'uppercase' }}>Hidayathul Anam Madrasa Kodakkad</h1>
                            <p style={{ margin: '5px 0', fontSize: '1.1rem', fontWeight: '500' }}>Student Progress Report</p>
                        </div>

                        <div className="result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: '1 1 auto' }}>
                                <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.75rem' }}>{record.name}</h3>
                                {record.fatherName && <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>Father: {record.fatherName}</p>}
                                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>Reg: {record.registerNumber}</p>
                            </div>
                            <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                                <span style={{ background: 'rgba(6, 78, 59, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold', display: 'inline-block' }}>
                                    {record.examType}
                                </span>
                                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>Class: {record.className}</p>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%' }}>Subject</th>
                                        <th style={{ textAlign: 'center', width: '20%' }}>Max Mark</th>
                                        <th style={{ textAlign: 'center', width: '20%' }}>Earned Mark</th>
                                        <th style={{ textAlign: 'right', width: '20%' }}>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {record.subjects.map((sub, sIdx) => (
                                        <tr key={sIdx}>
                                            <td>{sub.subjectName}</td>
                                            <td style={{ textAlign: 'center' }}>50</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{sub.mark}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{getGrade(sub.mark)}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ borderTop: '2px solid var(--primary)', background: 'rgba(6, 78, 59, 0.05)' }}>
                                        <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{totalMax}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>{totalEarned}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                                            {((totalEarned / totalMax) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }} className="no-print">
                            <button onClick={handleDownload} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Download Result
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default User;
