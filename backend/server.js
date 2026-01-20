const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
// Replace with your MongoDB URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student-marks';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Schema
const StudentMarkSchema = new mongoose.Schema({
    name: { type: String, required: true },
    registerNumber: { type: String, required: true },
    className: { type: String, required: true },
    examType: { type: String, required: true },
    subjects: [{
        subjectName: { type: String, required: true },
        mark: { type: Number, required: true }
    }]
});

const StudentMark = mongoose.model('StudentMark', StudentMarkSchema);

// Routes

// Admin: Add Mark
app.post('/api/admin/add-mark', async (req, res) => {
    try {
        const { name, registerNumber, className, examType, subjects } = req.body;

        const regNo = registerNumber.trim();
        const exam = examType.trim();

        // Check if marks for this specific exam already exist for this student
        const existingMark = await StudentMark.findOne({ registerNumber: regNo, examType: exam });
        if (existingMark) {
            return res.status(400).json({ message: `Student ${name} (${regNo}) already has marks for ${exam}.` });
        }

        // Filter out empty subjects
        const validSubjects = subjects.filter(sub => sub.subjectName && sub.mark !== '' && sub.mark !== null);

        const newMark = new StudentMark({
            name,
            registerNumber: regNo,
            className,
            examType: exam,
            subjects: validSubjects
        });

        await newMark.save();
        res.status(201).json({ message: 'Mark added successfully', data: newMark });
    } catch (error) {
        res.status(500).json({ message: 'Error adding mark', error: error.message });
    }
});

// Admin: Update Mark
app.put('/api/admin/update-mark/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, registerNumber, className, examType, subjects } = req.body;

        // Filter out empty subjects
        const validSubjects = subjects.filter(sub => sub.subjectName && sub.mark !== '' && sub.mark !== null);

        const updatedMark = await StudentMark.findByIdAndUpdate(id, {
            name,
            registerNumber,
            className,
            examType,
            subjects: validSubjects
        }, { new: true });

        if (!updatedMark) {
            return res.status(404).json({ message: 'Record not found' });
        }

        res.status(200).json({ message: 'Mark updated successfully', data: updatedMark });
    } catch (error) {
        res.status(500).json({ message: 'Error updating mark', error: error.message });
    }
});

// Admin: Login (Simple)
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    // Hardcoded password for simplicity as requested
    if (password === 'admin123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// User: Check Mark
app.post('/api/user/check-mark', async (req, res) => {
    try {
        const { registerNumber, name } = req.body;

        // Case insensitive search might be better, but exact match for now as per "user found show the marks"
        // matching both reg number and name
        const students = await StudentMark.find({
            registerNumber: registerNumber,
            name: { $regex: new RegExp(`^${name}$`, 'i') } // Case insensitive name match
        });

        if (students.length > 0) {
            res.status(200).json({ found: true, data: students });
        } else {
            res.status(200).json({ found: false, message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// For Vercel, we need to export the app
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
