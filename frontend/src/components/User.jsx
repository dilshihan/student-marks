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

            // Scroll to top so html2canvas can capture the full element on mobile
            window.scrollTo(0, 0);
            element.scrollIntoView({ behavior: 'instant', block: 'start' });

            // Get the full dimensions of the element (not viewport-limited)
            const fullWidth = element.scrollWidth;
            // Use offsetHeight for tight fit with no extra blank space
            const fullHeight = element.offsetHeight;

            // Use a fixed desktop width so subject names never wrap on mobile
            const fixedWidth = Math.max(fullWidth, 900);

            const canvas = await html2canvas(element, {
                scale: 2,                    // Higher scale for better quality
                useCORS: true,
                backgroundColor: '#ffffff',
                // Force a minimum desktop-width capture so text doesn't wrap on mobile
                windowWidth: fixedWidth,
                windowHeight: fullHeight,
                width: fixedWidth,
                height: fullHeight,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
            });

            if (downloadBtn) downloadBtn.style.display = 'flex';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // If content is taller than one A4 page, split across multiple pages
            const pageHeightMM = pdf.internal.pageSize.getHeight();
            if (pdfHeight <= pageHeightMM) {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            } else {
                // Multi-page support: slice the canvas into A4-sized chunks
                const pageHeightPx = Math.floor((canvas.width * pageHeightMM) / pdfWidth);
                let yOffset = 0;
                while (yOffset < canvas.height) {
                    const sliceHeight = Math.min(pageHeightPx, canvas.height - yOffset);
                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sliceHeight;
                    const ctx = pageCanvas.getContext('2d');
                    ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
                    const pageImg = pageCanvas.toDataURL('image/png');
                    const sliceHeightMM = (sliceHeight * pdfWidth) / canvas.width;
                    if (yOffset > 0) pdf.addPage();
                    pdf.addImage(pageImg, 'PNG', 0, 0, pdfWidth, sliceHeightMM);
                    yOffset += sliceHeight;
                }
            }

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
            if (downloadBtn) downloadBtn.style.display = 'flex';
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

                        {/* Attendance Summary */}
                        {(record.totalWorkingDays > 0 || record.totalWorkingDaysAttended > 0) && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                background: 'rgba(6, 78, 59, 0.03)',
                                borderRadius: '0.8rem',
                                border: '1px solid rgba(6, 78, 59, 0.1)'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Total Working Days</p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>{record.totalWorkingDays || 0}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Attended Days</p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>{record.totalWorkingDaysAttended || 0}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Percentage</p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
                                        {record.totalWorkingDays > 0
                                            ? ((record.totalWorkingDaysAttended / record.totalWorkingDays) * 100).toFixed(1) + '%'
                                            : '0%'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="table-responsive" style={{ marginTop: '1rem', border: '1px solid #f1f5f9', borderRadius: '0.75rem', overflowX: 'auto' }}>
                            <table className="results-table" style={{ width: '100%', minWidth: '320px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{
                                            padding: '0.75rem 0.5rem',
                                            border: '1px solid #eee',
                                            textAlign: 'left',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            width: '45%'
                                        }}>Subject</th>
                                        <th style={{
                                            padding: '0.75rem 0.25rem',
                                            border: '1px solid #eee',
                                            textAlign: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            width: '15%'
                                        }}>Max</th>
                                        <th style={{
                                            padding: '0.75rem 0.25rem',
                                            border: '1px solid #eee',
                                            textAlign: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            width: '15%'
                                        }}>Mark</th>
                                        <th style={{
                                            padding: '0.75rem 0.25rem',
                                            border: '1px solid #eee',
                                            textAlign: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            width: '25%'
                                        }}>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {record.subjects.map((sub, sIdx) => {
                                        const isSubjectFailed = Number(sub.mark) < 18;
                                        return (
                                            <tr key={sIdx}>
                                                <td style={{
                                                    padding: '0.75rem 1rem',
                                                    border: '1px solid #eee',
                                                    fontWeight: '500'
                                                }}>{sub.subjectName}</td>
                                                <td style={{
                                                    textAlign: 'center',
                                                    border: '1px solid #eee',
                                                    padding: '0.75rem 0.5rem'
                                                }}>50</td>
                                                <td style={{
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    color: isSubjectFailed ? '#dc2626' : 'var(--primary)',
                                                    border: '1px solid #eee',
                                                    padding: '0.75rem 0.5rem'
                                                }}>{sub.mark}</td>
                                                <td style={{
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    color: isSubjectFailed ? '#dc2626' : 'inherit',
                                                    border: '1px solid #eee',
                                                    padding: '0.75rem 0.5rem'
                                                }}>{getGrade(sub.mark)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr style={{ background: 'rgba(6, 78, 59, 0.05)' }}>
                                        <td style={{
                                            fontWeight: '800',
                                            padding: '0.75rem 0.5rem',
                                            border: '1px solid #eee',
                                            color: 'var(--primary)',
                                            fontSize: '0.75rem'
                                        }}>TOTAL</td>
                                        <td style={{
                                            textAlign: 'center',
                                            fontWeight: '800',
                                            border: '1px solid #eee',
                                            padding: '0.75rem 0.25rem',
                                            fontSize: '0.75rem'
                                        }}>{totalMax}</td>
                                        <td style={{
                                            textAlign: 'center',
                                            fontWeight: '800',
                                            color: 'var(--primary)',
                                            border: '1px solid #eee',
                                            padding: '0.75rem 0.25rem',
                                            fontSize: '0.75rem'
                                        }}>{totalEarned}</td>
                                        <td style={{
                                            textAlign: 'center',
                                            fontWeight: '800',
                                            color: 'var(--primary)',
                                            border: '1px solid #eee',
                                            padding: '0.75rem 0.25rem',
                                            fontSize: '0.75rem'
                                        }}>
                                            <span style={{ whiteSpace: 'nowrap' }}>
                                                {((totalEarned / totalMax) * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Pass/Fail Status Badge */}
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            {(() => {
                                const isPassed = record.subjects.every(sub => Number(sub.mark) >= 18);
                                return (
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.4rem 1.2rem',
                                        borderRadius: '0.4rem',
                                        fontSize: '0.95rem',
                                        fontWeight: '700',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        backgroundColor: isPassed ? 'rgba(6, 78, 59, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                        color: isPassed ? '#064e3b' : '#dc2626',
                                        border: `1.5px solid ${isPassed ? '#064e3b' : '#dc2626'}`,
                                    }}>
                                        {isPassed ? '✓ Passed' : '✗ Failed'}
                                    </span>
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
