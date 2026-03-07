const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
// Load .env for local dev; silently skip if not found (Vercel injects env vars automatically)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Setup
const connectDB = async () => {
    // Check if we already have a connection
    if (mongoose.connection.readyState >= 1) return;

    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error('CRITICAL: MONGO_URI is not defined in environment variables');
        throw new Error('MONGO_URI is missing');
    }

    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            connectTimeoutMS: 10000,
        });
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        throw err;
    }
};

// Middleware to ensure DB is connected before any API request
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('Database connection middleware error:', err);
        res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
});



// Schema
const StudentMarkSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fatherName: { type: String, required: false },
    registerNumber: { type: String, required: true },
    className: { type: String, required: true },
    examType: { type: String, required: true },
    totalWorkingDays: { type: Number, required: false },
    totalWorkingDaysAttended: { type: Number, required: false },
    subjects: [{
        subjectName: { type: String, required: true },
        mark: { type: Number, required: true }
    }]
}, { timestamps: true });

// Compound unique index to prevent duplicate marks for same student and same exam
StudentMarkSchema.index({ registerNumber: 1, examType: 1 }, { unique: true });

// Prevent model re-definition error in HMR/Serverless
const StudentMark = mongoose.models.StudentMark || mongoose.model('StudentMark', StudentMarkSchema);

// Routes

// Admin: Add Mark
app.post('/api/admin/add-mark', async (req, res) => {
    try {
        const { name, fatherName, registerNumber, className, examType, subjects, totalWorkingDays, totalWorkingDaysAttended } = req.body;

        if (!name || !registerNumber || !className || !examType) {
            return res.status(400).json({ message: 'All required fields (Name, Register Number, Class, Exam Type) must be provided' });
        }

        const regNo = registerNumber.trim().toUpperCase();
        const exam = examType.trim();

        // 1. Check if this register number is associated with a DIFFERENT name already
        // This prevents the same register number from being used by two different students
        const otherStudent = await StudentMark.findOne({
            registerNumber: regNo,
            name: { $ne: name.trim() }
        });
        if (otherStudent) {
            return res.status(400).json({
                message: `Register number ${regNo} is already assigned to student "${otherStudent.name}".`
            });
        }

        // 2. Check if marks for this specific exam already exist for this student
        const existingMark = await StudentMark.findOne({ registerNumber: regNo, examType: exam });
        if (existingMark) {
            return res.status(400).json({ message: `Student ${name} (${regNo}) already has marks for ${exam}.` });
        }

        // Filter out empty subjects
        const validSubjects = subjects ? subjects.filter(sub => sub.subjectName && sub.mark !== '' && sub.mark !== null) : [];

        const newMark = new StudentMark({
            name: name.trim(),
            fatherName: fatherName ? fatherName.trim() : '',
            registerNumber: regNo,
            className: className.trim(),
            examType: exam,
            totalWorkingDays: totalWorkingDays || 0,
            totalWorkingDaysAttended: totalWorkingDaysAttended || 0,
            subjects: validSubjects
        });

        await newMark.save();
        res.status(201).json({ message: 'Mark added successfully', data: newMark });
    } catch (error) {
        console.error('Add mark error:', error);
        res.status(500).json({ message: 'Error adding mark', error: error.message });
    }
});

// Admin: Update Mark
app.put('/api/admin/update-mark/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, fatherName, registerNumber, className, examType, subjects, totalWorkingDays, totalWorkingDaysAttended } = req.body;

        const regNo = registerNumber ? registerNumber.trim().toUpperCase() : '';
        const exam = examType ? examType.trim() : '';

        // Check for uniqueness during update
        if (regNo && exam) {
            // Check if another student has this reg number
            const otherStudent = await StudentMark.findOne({
                _id: { $ne: id },
                registerNumber: regNo,
                name: { $ne: name.trim() }
            });
            if (otherStudent) {
                return res.status(400).json({
                    message: `Register number ${regNo} is already assigned to student "${otherStudent.name}".`
                });
            }

            // Check if this exam already exists for this reg number in ANOTHER record
            const duplicatedExam = await StudentMark.findOne({
                _id: { $ne: id },
                registerNumber: regNo,
                examType: exam
            });
            if (duplicatedExam) {
                return res.status(400).json({ message: `Marks for ${regNo} and ${exam} already exist in another record.` });
            }
        }

        // Filter out empty subjects safely
        const validSubjects = subjects && Array.isArray(subjects)
            ? subjects.filter(sub => sub.subjectName && sub.mark !== '' && sub.mark !== null)
            : [];

        const updatedMark = await StudentMark.findByIdAndUpdate(id, {
            name: name ? name.trim() : '',
            fatherName: fatherName ? fatherName.trim() : '',
            registerNumber: regNo,
            className: className ? className.trim() : '',
            examType: exam,
            totalWorkingDays: totalWorkingDays || 0,
            totalWorkingDaysAttended: totalWorkingDaysAttended || 0,
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

// Admin: Delete Mark
app.delete('/api/admin/delete-mark/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedMark = await StudentMark.findByIdAndDelete(id);

        if (!deletedMark) {
            return res.status(404).json({ message: 'Record not found' });
        }

        res.status(200).json({ message: 'Mark deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting mark', error: error.message });
    }
});

// Admin: Get All Marks
app.get('/api/admin/all-marks', async (req, res) => {
    try {
        // Since we added timestamps, we can sort by createdAt
        const marks = await StudentMark.find({}).sort({ updatedAt: -1 });
        res.status(200).json(marks);
    } catch (error) {
        console.error('Fetch all marks error:', error);
        res.status(500).json({ message: 'Error fetching marks', error: error.message });
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});

// Admin: Login (Simple)
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    // Hardcoded password for simplicity as requested
    if (password === 'ham1156kkd') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// User: Check Mark
app.post('/api/user/check-mark', async (req, res) => {
    try {
        const { registerNumber } = req.body;

        if (!registerNumber) {
            return res.status(400).json({ message: 'Register number is required' });
        }

        const regNo = String(registerNumber).trim().toUpperCase();

        const students = await StudentMark.find({
            registerNumber: regNo
        });

        if (students && students.length > 0) {
            res.status(200).json({ found: true, data: students });
        } else {
            res.status(200).json({ found: false, message: 'Student not found' });
        }
    } catch (error) {
        console.error('Check mark error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    });
});

// For Vercel, we need to export the app
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
