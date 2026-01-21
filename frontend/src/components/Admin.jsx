import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const Admin = () => {
    const [mode, setMode] = useState('add'); // 'add' or 'edit'
    const [search, setSearch] = useState({ registerNumber: '', name: '' });
    const [searchResults, setSearchResults] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        registerNumber: '',
        className: '',
        examType: 'Internal / Series Exam',
        subjects: Array(7).fill({ subjectName: '', mark: '' })
    });

    const resetForm = () => {
        setFormData({
            name: '',
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
                    text: 'No matching records found',
                    background: '#1e293b',
                    color: '#fff'
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
            registerNumber: record.registerNumber,
            className: record.className,
            examType: record.examType,
            subjects: record.subjects.length === 6 ? record.subjects :
                [...record.subjects, ...Array(6 - record.subjects.length).fill({ subjectName: '', mark: '' })]
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
                    text: 'Marks updated successfully',
                    background: '#1e293b',
                    color: '#fff'
                });
            } else {
                // Add
                await axios.post('/api/admin/add-mark', formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Marks added successfully',
                    background: '#1e293b',
                    color: '#fff'
                });
            }
            resetForm();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Operation failed',
                background: '#1e293b',
                color: '#fff'
            });
        }
    };

    return (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <button
                    className="btn-primary"
                    style={{ opacity: mode === 'add' ? 1 : 0.5 }}
                    onClick={() => { setMode('add'); resetForm(); }}
                >
                    Add New
                </button>
                <button
                    className="btn-primary"
                    style={{ opacity: mode === 'edit' ? 1 : 0.5 }}
                    onClick={() => { setMode('edit'); resetForm(); }}
                >
                    Update Existing
                </button>
            </div>

            {mode === 'edit' && !editingId && (
                <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
                    <h3>Find Student to Edit</h3>
                    <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem' }}>
                        <input
                            className="input-field"
                            name="registerNumber"
                            placeholder="Register Number"
                            value={search.registerNumber}
                            onChange={(e) => setSearch({ ...search, registerNumber: e.target.value })}
                            required
                        />
                        <input
                            className="input-field"
                            name="name"
                            placeholder="Student Name"
                            value={search.name}
                            onChange={(e) => setSearch({ ...search, name: e.target.value })}
                            required
                        />
                        <button type="submit" className="btn-primary">Search</button>
                    </form>

                    {searchResults.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            {searchResults.map(result => (
                                <div key={result._id} className="glass-card" style={{ padding: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <strong>{result.name}</strong> ({result.registerNumber}) <br />
                                        <small>{result.examType} - {result.className}</small>
                                    </div>
                                    <button className="btn-primary" onClick={() => handleEdit(result)}>Edit</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {(mode === 'add' || editingId) && (
                <div>
                    <h2>{editingId ? 'Update Marks' : 'Add Student Marks'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input className="input-field" name="name" placeholder="Student Name" value={formData.name} onChange={handleChange} required />
                            <input className="input-field" name="registerNumber" placeholder="Register Number" value={formData.registerNumber} onChange={handleChange} required />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input className="input-field" name="className" placeholder="Class" value={formData.className} onChange={handleChange} required />
                            <select className="input-field" name="examType" value={formData.examType} onChange={handleChange} style={{ appearance: 'none' }}>
                                <option value="Internal / Series Exam" style={{ color: 'black' }}>Internal / Series Exam</option>
                                <option value="Model Exam" style={{ color: 'black' }}>Model Exam</option>
                                <option value="Semester / Final Exam" style={{ color: 'black' }}>Semester / Final Exam</option>
                            </select>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', textAlign: 'left' }}>Subjects & Marks</h3>
                            {formData.subjects.map((subject, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <input
                                        className="input-field"
                                        placeholder={`Subject ${index + 1} Name`}
                                        value={subject.subjectName}
                                        onChange={(e) => handleSubjectChange(index, 'subjectName', e.target.value)}
                                    // Not required
                                    />
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder={`Mark`}
                                        value={subject.mark}
                                        onChange={(e) => handleSubjectChange(index, 'mark', e.target.value)}
                                    // Not required
                                    />
                                </div>
                            ))}
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                            {editingId ? 'Update Record' : 'Add Record'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => { setMode('edit'); setEditingId(null); }} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '0.5rem', borderRadius: '0.5rem', marginTop: '1rem', width: '100%', cursor: 'pointer' }}>
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
