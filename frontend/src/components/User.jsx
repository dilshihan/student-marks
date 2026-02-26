import React, { useState, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const User = () => {
    const [search, setSearch] = useState({ registerNumber: '' });
    const [results, setResults] = useState(null);
    const resultRef = useRef(null);

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

    const handleDownload = async (record) => {
        const element = document.getElementById(`report-${record.registerNumber}`);
        if (!element) return;

        // Visual feedback
        Swal.fire({
            title: 'Generating PDF...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // Temporarily hide the download button from the capture
            const downloadBtn = element.querySelector('.no-export');
            if (downloadBtn) downloadBtn.style.display = 'none';

            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            if (downloadBtn) downloadBtn.style.display = 'flex';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${record.name}_${record.registerNumber}_Marks.pdf`);

            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'Downloaded!',
                text: 'Your mark sheet has been saved as a PDF.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('PDF generation error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Download Failed',
                text: 'Could not generate PDF. Please try again or use the print option.'
            });
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                    <div key={idx} id={`report-${record.registerNumber}`} className="glass-card" style={{ marginTop: '2rem', textAlign: 'left', borderTop: '4px solid var(--primary)', background: 'white' }}>
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
                                        <th style={{ width: '40%', border: '1px solid #eee' }}>Subject</th>
                                        <th style={{ textAlign: 'center', width: '20%', border: '1px solid #eee' }}>Max Mark</th>
                                        <th style={{ textAlign: 'center', width: '20%', border: '1px solid #eee' }}>Earned Mark</th>
                                        <th style={{ textAlign: 'right', width: '20%', border: '1px solid #eee' }}>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {record.subjects.map((sub, sIdx) => {
                                        const isSubjectFailed = Number(sub.mark) < 18;
                                        return (
                                            <tr key={sIdx}>
                                                <td style={{ border: '1px solid #eee' }}>{sub.subjectName}</td>
                                                <td style={{ textAlign: 'center', border: '1px solid #eee' }}>50</td>
                                                <td style={{
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    color: isSubjectFailed ? '#dc2626' : 'var(--primary)',
                                                    border: '1px solid #eee'
                                                }}>{sub.mark}</td>
                                                <td style={{
                                                    textAlign: 'right',
                                                    fontWeight: 'bold',
                                                    color: isSubjectFailed ? '#dc2626' : 'inherit',
                                                    border: '1px solid #eee'
                                                }}>{getGrade(sub.mark)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr style={{ borderTop: '2px solid var(--primary)', background: 'rgba(6, 78, 59, 0.05)' }}>
                                        <td style={{ fontWeight: 'bold', fontSize: '1.1rem', border: '1px solid #eee' }}>Total</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', border: '1px solid #eee' }}>{totalMax}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)', border: '1px solid #eee' }}>{totalEarned}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)', border: '1px solid #eee' }}>
                                            {((totalEarned / totalMax) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Pass/Fail Status Badge */}
                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            {(() => {
                                const isPassed = record.subjects.every(sub => Number(sub.mark) >= 18);
                                return (
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.75rem 2.5rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '1.5rem',
                                        fontWeight: '800',
                                        letterSpacing: '2px',
                                        textTransform: 'uppercase',
                                        backgroundColor: isPassed ? 'rgba(6, 78, 59, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                        color: isPassed ? '#064e3b' : '#dc2626',
                                        border: `2px solid ${isPassed ? '#064e3b' : '#dc2626'}`,
                                    }}>
                                        {isPassed ? 'PASSED' : 'FAILED'}
                                    </div>
                                );
                            })()}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }} className="no-export">
                            <button onClick={() => handleDownload(record)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Download PDF
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default User;
