import express from 'express';
const router = express.Router();
import {
  createExam,
  getAdminExams,
  getExamById,
  getAdminExamById,
  deleteExam,
  updateExam,
  submitExam,
} from '../controllers/examController.js';
import { getSubmissionsByExam, deleteSubmission } from '../controllers/submissionController.js';
import { protect, authorize } from '../middleware/auth.js';

// Public/Student routes
router.get('/:id', getExamById);
router.post('/:id/submit', submitExam);

// Admin routes
router.route('/')
  .post(protect, createExam)
  .get(protect, getAdminExams);

router.get('/admin/:id', protect, getAdminExamById);

router.route('/:id')
  .get(getExamById)
  .put(protect, updateExam)
  .delete(protect, authorize('super'), deleteExam);

// Submission analytics
router.get('/:examId/submissions', protect, getSubmissionsByExam);
router.delete('/submissions/:id', protect, authorize('super'), deleteSubmission);

export default router;
