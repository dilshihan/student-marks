import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const Admin = () => {
    const [mode, setMode] = useState('add'); // 'add' or 'edit'
    const [search, setSearch] = useState({ registerNumber: '' });
    const [searchResults, setSearchResults] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [allRecords, setAllRecords] = useState([]);
    const [classFilter, setClassFilter] = useState('');
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
                            placeholder="Filter by Class (e.g. 10A)"
                            value={classFilter}
                            onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
                        {(() => {
                            const filtered = allRecords.filter(r =>
                                !classFilter || r.className?.toLowerCase().includes(classFilter.toLowerCase())
                            );
                            const totalPages = Math.ceil(filtered.length / itemsPerPage);
                            const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                            if (paginated.length > 0) {
                                return (
                                    <>
                                        {paginated.map(record => (
                                            <div key={record._id} className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ textAlign: 'left' }}>
                                                    <strong>{record.name}</strong> <br />
                                                    {record.fatherName && <><small>Father: {record.fatherName}</small> <br /></>}
                                                    <small>Reg: {record.registerNumber}</small>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <small>{record.className}</small> <br />
                                                    <small>{record.examType}</small>
                                                </div>
                                            </div>
                                        ))}

                                        {totalPages > 1 && (
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem', paddingBottom: '1rem' }}>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '0.5rem 1rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                                >
                                                    Previous
                                                </button>
                                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '0.5rem 1rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                );
                            } else {
                                return <p style={{ marginTop: '1rem' }}>No records found for this class.</p>;
                            }
                        })()}
                    </div>
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
