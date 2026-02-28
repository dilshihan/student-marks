import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// Map Arabic class numbers to Roman numerals
const arabicToRoman = {
    '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
    '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
    '11': 'XI', '12': 'XII'
};

// Map Roman numerals back to Arabic for reverse lookup
const romanToArabic = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
    'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
    'XI': '11', 'XII': '12'
};

// Convert a className like "10A" or "10" to display "X" or "XA"
const toRomanClass = (className) => {
    if (!className) return className;
    const match = className.match(/^(\d+)(.*)$/);
    if (match) {
        const num = match[1];
        const suffix = match[2];
        return (arabicToRoman[num] || num) + suffix;
    }
    return className;
};

// Check if a className matches a Roman numeral filter
const classMatchesFilter = (className, filter) => {
    if (!filter) return true;
    const f = filter.trim().toUpperCase();
    // Direct match with stored class name (Arabic)
    if (className?.toLowerCase().includes(filter.toLowerCase())) return true;
    // Roman numeral: convert filter roman to arabic and check
    const arabicEquiv = romanToArabic[f];
    if (arabicEquiv) {
        return className?.toLowerCase().includes(arabicEquiv.toLowerCase());
    }
    // Also match display roman class
    const romanDisplay = toRomanClass(className || '').toUpperCase();
    return romanDisplay.includes(f);
};

const Admin = () => {
    const [mode, setMode] = useState('add'); // 'add' or 'edit'
    const [search, setSearch] = useState({ registerNumber: '' });
    const [searchResults, setSearchResults] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [allRecords, setAllRecords] = useState([]);
    const [classFilter, setClassFilter] = useState('');
    const [expandedClass, setExpandedClass] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [formData, setFormData] = useState({
        name: '',
        fatherName: '',
        registerNumber: '',
        className: '',
        examType: 'Internal / Series Exam',
        subjects: Array(7).fill({ subjectName: '', mark: '' })
    });

    const resetForm = () => {
        setFormData({
            name: '',
            fatherName: '',
            registerNumber: '',
            className: '',
            examType: 'Internal / Series Exam',
            subjects: Array(7).fill({ subjectName: '', mark: '' })
        });
        setEditingId(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubjectChange = (index, field, value) => {
        const newSubjects = [...formData.subjects];
        newSubjects[index] = { ...newSubjects[index], [field]: value };
        setFormData({ ...formData, subjects: newSubjects });
    };

    const fetchAllRecords = async () => {
        try {
            const res = await axios.get('/api/admin/all-marks');
            setAllRecords(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/user/check-mark', search);
            if (res.data.found) {
                setSearchResults(res.data.data);
            } else {
                setSearchResults([]);
                Swal.fire({
                    icon: 'info',
                    title: 'Not Found',
                    text: 'No matching records found'
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (record) => {
        setMode('edit'); // Switch mode so the list hides and the form shows
        setEditingId(record._id);
        setFormData({
            name: record.name,
            fatherName: record.fatherName,
            registerNumber: record.registerNumber,
            className: record.className,
            examType: record.examType,
            subjects: record.subjects.length >= 7 ? record.subjects.slice(0, 7) :
                [...record.subjects, ...Array(7 - record.subjects.length).fill({ subjectName: '', mark: '' })]
        });
        setSearchResults([]); // Clear search results to show form
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                // Update
                await axios.put(`/api/admin/update-mark/${editingId}`, formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Updated',
                    text: 'Marks updated successfully'
                });
            } else {
                // Add
                await axios.post('/api/admin/add-mark', formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Marks added successfully'
                });
            }
            resetForm();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Operation failed'
            });
        }
    };

    return (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    className="btn-primary"
                    style={{ opacity: mode === 'add' ? 1 : 0.5, flex: '1 1 auto' }}
                    onClick={() => { setMode('add'); resetForm(); }}
                >
                    Add New
                </button>
                <button
                    className="btn-primary"
                    style={{ opacity: mode === 'edit' ? 1 : 0.5, flex: '1 1 auto' }}
                    onClick={() => { setMode('edit'); resetForm(); }}
                >
                    Update Existing
                </button>
                <button
                    className="btn-primary"
                    style={{ opacity: mode === 'list' ? 1 : 0.5, flex: '1 1 auto' }}
                    onClick={() => { setMode('list'); resetForm(); fetchAllRecords(); }}
                >
                    Existing Students
                </button>
            </div>

            {mode === 'edit' && !editingId && (
                <div style={{ marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem' }}>
                    <h3>Find Student to Edit</h3>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            className="input-field"
                            name="registerNumber"
                            placeholder="Register Number"
                            value={search.registerNumber}
                            onChange={(e) => setSearch({ registerNumber: e.target.value })}
                            style={{ marginBottom: 0, flex: 1 }}
                            required
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '0 2rem' }}>Search</button>
                    </form>

                    {searchResults.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            {searchResults.map(result => (
                                <div key={result._id} className="glass-card" style={{ padding: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <strong>{result.name}</strong> ({result.registerNumber}) <br />
                                        {result.fatherName && <><small>Father: {result.fatherName}</small> <br /></>}
                                        <small>{result.examType} - {result.className}</small>
                                    </div>
                                    <button className="btn-primary" onClick={() => handleEdit(result)}>Edit</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {mode === 'list' && (
                <div>
                    <h3>Existing Students List</h3>
                    <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                        <input
                            className="input-field"
                            placeholder="Search by Class (Roman numeral e.g. I, II, X, XI)"
                            value={classFilter}
                            onChange={(e) => { setClassFilter(e.target.value); setExpandedClass(null); }}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {(() => {
                        const filtered = allRecords.filter(r => classMatchesFilter(r.className, classFilter));

                        const groups = {};
                        filtered.forEach(r => {
                            const key = r.className || 'Unknown';
                            if (!groups[key]) groups[key] = [];
                            groups[key].push(r);
                        });

                        const classKeys = Object.keys(groups).sort((a, b) => {
                            const numA = parseInt(a) || 999;
                            const numB = parseInt(b) || 999;
                            return numA - numB;
                        });

                        if (classKeys.length === 0) {
                            return <p style={{ marginTop: '1rem', textAlign: 'center' }}>No records found.</p>;
                        }

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {classKeys.map(cls => {
                                    const students = groups[cls];
                                    const isOpen = expandedClass === cls;
                                    const romanLabel = toRomanClass(cls);

                                    return (
                                        <div key={cls} style={{
                                            border: '1px solid rgba(99,102,241,0.3)',
                                            borderRadius: '1rem',
                                            overflow: 'hidden',
                                            boxShadow: isOpen ? '0 4px 24px rgba(99,102,241,0.15)' : '0 1px 6px rgba(0,0,0,0.1)'
                                        }}>
                                            <button
                                                onClick={() => setExpandedClass(isOpen ? null : cls)}
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '1rem 1.5rem',
                                                    background: isOpen
                                                        ? 'linear-gradient(135deg, var(--primary, #6366f1), #818cf8)'
                                                        : 'rgba(99,102,241,0.08)',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.25s ease',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span style={{
                                                        width: '2.8rem',
                                                        height: '2.8rem',
                                                        borderRadius: '50%',
                                                        background: isOpen ? 'rgba(255,255,255,0.25)' : 'var(--primary, #6366f1)',
                                                        color: '#fff',
                                                        fontWeight: '800',
                                                        fontSize: '0.9rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        letterSpacing: '0.05em',
                                                        flexShrink: 0,
                                                    }}>
                                                        {romanLabel}
                                                    </span>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{
                                                            fontWeight: '700',
                                                            fontSize: '1.05rem',
                                                            color: isOpen ? '#fff' : 'inherit'
                                                        }}>
                                                            Class {romanLabel}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            color: isOpen ? 'rgba(255,255,255,0.8)' : '#64748b'
                                                        }}>
                                                            {students.length} Student{students.length !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '1.5rem',
                                                    color: isOpen ? '#fff' : 'var(--primary, #6366f1)',
                                                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.25s ease',
                                                    lineHeight: 1,
                                                }}>
                                                    ›
                                                </span>
                                            </button>

                                            {isOpen && (
                                                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {students.map(record => {
                                                        const isPassed = record.subjects.length > 0 && record.subjects.every(sub => Number(sub.mark) >= 18);
                                                        return (
                                                            <div
                                                                key={record._id}
                                                                className="glass-card"
                                                                style={{
                                                                    padding: '0.85rem 1rem',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    marginBottom: 0,
                                                                    borderLeft: `3px solid ${isPassed ? '#059669' : '#dc2626'}`
                                                                }}
                                                            >
                                                                <div style={{ textAlign: 'left' }}>
                                                                    <strong style={{ fontSize: '0.95rem' }}>{record.name}</strong>
                                                                    {record.fatherName && (
                                                                        <><br /><small style={{ color: '#64748b' }}>Father: {record.fatherName}</small></>
                                                                    )}
                                                                    <br />
                                                                    <small style={{ color: '#64748b' }}>Reg: {record.registerNumber}</small>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <small style={{ display: 'block', color: '#64748b' }}>{record.examType}</small>
                                                                    <span style={{
                                                                        color: isPassed ? '#059669' : '#dc2626',
                                                                        fontWeight: 'bold',
                                                                        fontSize: '0.8rem',
                                                                        textTransform: 'uppercase',
                                                                        marginTop: '0.25rem',
                                                                        display: 'block'
                                                                    }}>
                                                                        {isPassed ? '✓ Passed' : '✗ Failed'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            )}

            {(mode === 'add' || editingId) && (
                <div>
                    <h2>{editingId ? 'Update Marks' : 'Add Student Marks'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="responsive-grid" style={{ marginBottom: '1rem' }}>
                            <input className="input-field" name="name" placeholder="Student Name" value={formData.name} onChange={handleChange} style={{ marginBottom: 0 }} required />
                            <input className="input-field" name="fatherName" placeholder="Father Name (Optional)" value={formData.fatherName} onChange={handleChange} style={{ marginBottom: 0 }} />
                        </div>
                        <div className="responsive-grid" style={{ marginBottom: '1rem' }}>
                            <input className="input-field" name="registerNumber" placeholder="Register Number" value={formData.registerNumber} onChange={handleChange} style={{ marginBottom: 0 }} required />
                            <input className="input-field" name="className" placeholder="Class" value={formData.className} onChange={handleChange} style={{ marginBottom: 0 }} required />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <select className="input-field" name="examType" value={formData.examType} onChange={handleChange} style={{ appearance: 'none', marginBottom: 0 }}>
                                <option value="Internal / Series Exam" style={{ color: 'black' }}>Internal / Series Exam</option>
                                <option value="Model Exam" style={{ color: 'black' }}>Model Exam</option>
                                <option value="Semester / Final Exam" style={{ color: 'black' }}>Semester / Final Exam</option>
                            </select>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', textAlign: 'left' }}>Subjects & Marks</h3>
                            {formData.subjects.map((subject, index) => (
                                <div key={index} className="responsive-grid" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        className="input-field"
                                        placeholder={`Subject ${index + 1} Name`}
                                        value={subject.subjectName}
                                        onChange={(e) => handleSubjectChange(index, 'subjectName', e.target.value)}
                                        style={{ marginBottom: 0 }}
                                    // Not required
                                    />
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder={`Mark`}
                                        value={subject.mark}
                                        onChange={(e) => handleSubjectChange(index, 'mark', e.target.value)}
                                        style={{ marginBottom: 0 }}
                                    // Not required
                                    />
                                </div>
                            ))}
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                            {editingId ? 'Update Record' : 'Add Record'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => { setMode('edit'); setEditingId(null); }} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '0.5rem', marginTop: '1rem', width: '100%', cursor: 'pointer', fontWeight: '600' }}>
                                Cancel Edit
                            </button>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
};

export default Admin;
