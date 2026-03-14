import Submission from '../models/Submission.js';

// @desc    Get all submissions for an exam
// @route   GET /api/admin/submissions/:examId
// @access  Private (Admin)
const getSubmissionsByExam = async (req, res) => {
  const submissions = await Submission.find({ examId: req.params.examId })
    .select('-answers') // Exclude heavy answers map in the list view
    .sort({ submittedAt: -1 })
    .lean();
  res.json(submissions);
};

// @desc    Get all submissions (Admin)
// @route   GET /api/admin/submissions
// @access  Private (Admin)
const getAllSubmissions = async (req, res) => {
  const submissions = await Submission.find()
    .populate('examId', 'title')
    .select('-answers')
    .sort({ submittedAt: -1 })
    .lean();
  res.json(submissions);
};

// @desc    Delete a submission
// @route   DELETE /api/admin/submissions/:id
// @access  Private (Super Admin)
const deleteSubmission = async (req, res) => {
  const submission = await Submission.findById(req.params.id);

  if (submission) {
    await submission.deleteOne();
    res.json({ message: 'Submission removed' });
  } else {
    res.status(404).json({ message: 'Submission not found' });
  }
};

export {
  getSubmissionsByExam,
  getAllSubmissions,
  deleteSubmission,
};
