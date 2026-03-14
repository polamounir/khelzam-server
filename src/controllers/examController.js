import Exam from '../models/Exam.js';
import Submission from '../models/Submission.js';

// Helper to normalize image path to full URL
const normalizeImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Admin)
const createExam = async (req, res) => {
  try {
    const { title, description, startDate, endDate, questions, image } = req.body;

    const exam = new Exam({
      title,
      description,
      startDate,
      endDate,
      questions,
      image,
      createdBy: req.admin._id,
    });

    const createdExam = await exam.save();
    res.status(201).json(createdExam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all exams (Admin)
// @route   GET /api/admin/exams
// @access  Private (Admin)
const getAdminExams = async (req, res) => {
  // Fetch only necessary fields for the list view
  const exams = await Exam.find({})
    .select('title description image startDate endDate questions createdBy')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const examsWithStats = await Promise.all(exams.map(async (exam) => {
    const submissionCount = await Submission.countDocuments({ examId: exam._id });
    return {
      ...exam,
      questionCount: exam.questions?.length || 0,
      submissionCount,
      image: normalizeImageUrl(req, exam.image),
    };
  }));

  res.json(examsWithStats);
};

// @desc    Get single exam (Public/Student) - Strips correct answers
// @route   GET /api/exams/:id
// @access  Public
const getExamById = async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (exam) {
    // Check if exam has started
    const now = new Date();
    if (now < new Date(exam.startDate)) {
      return res.status(400).json({ message: 'Exam has not started yet' });
    }
    if (now > new Date(exam.endDate)) {
      return res.status(400).json({ message: 'Exam has already ended' });
    }

    // Strip correct answers and normalize images
    const strippedQuestions = exam.questions.map(q => {
      const qObj = q.toObject ? q.toObject() : q;
      const { correctAnswer, ...rest } = qObj;
      rest.image = normalizeImageUrl(req, rest.image);
      return rest;
    });

    const strippedExam = exam.toObject();
    strippedExam.questions = strippedQuestions;
    strippedExam.image = normalizeImageUrl(req, strippedExam.image);

    res.json(strippedExam);
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
};

// @desc    Get single exam (Admin) - Includes correct answers
// @route   GET /api/exams/admin/:id
// @access  Private (Admin)
const getAdminExamById = async (req, res) => {
  const exam = await Exam.findById(req.params.id).lean();

  if (exam) {
    const examObj = { ...exam };
    
    // Normalize images
    examObj.image = normalizeImageUrl(req, examObj.image);
    examObj.questions = examObj.questions.map(q => ({
      ...q,
      image: normalizeImageUrl(req, q.image)
    }));

    res.json(examObj);
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Super Admin)
const deleteExam = async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (exam) {
    await exam.deleteOne();
    res.json({ message: 'Exam removed' });
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
};

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private (Admin)
const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
      exam.title = req.body.title || exam.title;
      exam.description = req.body.description || exam.description;
      exam.startDate = req.body.startDate || exam.startDate;
      exam.endDate = req.body.endDate || exam.endDate;
      exam.questions = req.body.questions || exam.questions;
      exam.image = req.body.image || exam.image;

      const updatedExam = await exam.save();
      res.json(updatedExam);
    } else {
      res.status(404).json({ message: 'Exam not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit exam answers
// @route   POST /api/exams/:id/submit
// @access  Public
const submitExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Server-side time validation
    const now = new Date();
    if (now > new Date(exam.endDate)) {
      return res.status(400).json({ message: 'Submission failed: Exam has already ended' });
    }

    const { userName, deviceFingerprint, answers, tabExitCount, tabReturnCount, integrityEvents } = req.body;

    // Duplicate check logic (handled by Mongoose unique index too)
    const existingSubmission = await Submission.findOne({
      examId: exam._id,
      deviceFingerprint,
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'Duplicate submission detected from this device' });
    }

    // Calculate scores
    let totalScore = 0;
    let studentScore = 0;
    
    exam.questions.forEach(question => {
      totalScore += question.score;
      const studentAnswer = answers[question.id];
      if (studentAnswer !== undefined) {
        // Handle array comparison for multiSelect
        if (Array.isArray(question.correctAnswer)) {
          if (Array.isArray(studentAnswer) && 
              studentAnswer.length === question.correctAnswer.length &&
              studentAnswer.every(val => question.correctAnswer.includes(val))) {
            studentScore += question.score;
          }
        } else if (String(studentAnswer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase()) {
          studentScore += question.score;
        }
      }
    });

    const percentage = totalScore > 0 ? (studentScore / totalScore) * 100 : 0;

    const submission = await Submission.create({
      examId: exam._id,
      userName,
      deviceFingerprint,
      ipAddress: req.ip,
      answers,
      tabExitCount,
      tabReturnCount,
      integrityEvents,
      score: studentScore,
    });

    res.status(201).json({
      message: 'Exam submitted successfully',
      result: {
        score: studentScore,
        totalPossibleScore: totalScore,
        percentage: percentage.toFixed(2),
        submittedAt: submission.submittedAt,
      },
      submissionId: submission._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export {
  createExam,
  getAdminExams,
  getExamById,
  getAdminExamById,
  deleteExam,
  updateExam,
  submitExam,
};
