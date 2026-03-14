import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './src/models/Admin.js';
import Exam from './src/models/Exam.js';
import Submission from './src/models/Submission.js';

dotenv.config();

const seedSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // 1. Ensure Super Admin exists
    let admin = await Admin.findOne({ email: 'john@khelzam.com' });
    if (!admin) {
      admin = await Admin.create({
        name: 'Super Admin',
        email: 'john@khelzam.com',
        password: 'john1103',
        role: 'super',
      });
      console.log('Created Super Admin');
    }

    // 2. Create Sample Exam
    const existingExam = await Exam.findOne({ title: 'React Performance & Integrity Test' });
    if (existingExam) {
        await Exam.deleteOne({ _id: existingExam._id });
        console.log('Removed old sample exam');
    }

    const exam = await Exam.create({
      title: 'React Performance & Integrity Test',
      description: 'Please complete all questions honestly. All activity is monitored.',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: admin._id,
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          text: 'Which React hook is used for managing side effects?',
          options: ['useState', 'useEffect', 'useMemo', 'useCallback'],
          correctAnswer: 'useEffect',
          score: 2,
        },
        {
          id: 'q2',
          type: 'trueFalse',
          text: 'React re-renders a component every time its state or props change.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          score: 1,
        },
        {
          id: 'q3',
          type: 'multiSelect',
          text: 'Which of the following are valid React performance optimization techniques?',
          options: ['useMemo', 'useCallback', 'React.memo', 'useState'],
          correctAnswer: ['useMemo', 'useCallback', 'React.memo'],
          score: 3,
        }
      ],
    });
    console.log(`Created Sample Exam: ${exam._id}`);

    // 3. Create Sample Submissions (Integrity Examples)
    await Submission.deleteMany({ examId: exam._id });

    // A. Clean Submission
    await Submission.create({
      examId: exam._id,
      userName: 'Alice Smith (Clean)',
      deviceFingerprint: 'device-alice-123',
      ipAddress: '192.168.1.1',
      tabExitCount: 0,
      tabReturnCount: 0,
      integrityEvents: [],
      answers: { 'q1': 'useEffect', 'q2': 'True', 'q3': ['useMemo', 'useCallback', 'React.memo'] },
      score: 6
    });

    // B. Suspect Submission (Frequent Tab Exits)
    await Submission.create({
      examId: exam._id,
      userName: 'Bob Jones (Suspect)',
      deviceFingerprint: 'device-bob-456',
      ipAddress: '192.168.1.5',
      tabExitCount: 15,
      tabReturnCount: 14,
      integrityEvents: [
        { type: 'blur', timestamp: new Date().toISOString() },
        { type: 'focus', timestamp: new Date(Date.now() + 5000).toISOString() },
        { type: 'blur', timestamp: new Date(Date.now() + 10000).toISOString() }
      ],
      answers: { 'q1': 'useEffect', 'q2': 'True', 'q3': ['useMemo'] },
      score: 3
    });

    console.log('Sample integrity data seeded successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedSampleData();
