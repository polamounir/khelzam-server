import express from 'express';
const router = express.Router();
import {
  loginAdmin,
  registerAdmin,
  getAdmins,
  deleteAdmin,
  updateProfile,
} from '../controllers/adminController.js';
import { getSubmissionsByExam, deleteSubmission, getAllSubmissions } from '../controllers/submissionController.js';
import { getUniqueDevices, getLogsByFingerprint } from '../controllers/logController.js';
import { getAppStats } from '../controllers/statsController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../config/multer.js';

// Public
router.post('/login', loginAdmin);

// Private (All Admins)
router.put('/profile', protect, updateProfile);
router.post('/upload', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    message: 'File uploaded successfully',
    url: `${baseUrl}/uploads/${req.file.filename}`,
  });
});

router.get('/submissions', protect, getAllSubmissions);
router.get('/stats', protect, getAppStats);

// Private (Super Admin only)
router.route('/')
  .post(protect, authorize('super'), registerAdmin)
  .get(protect, authorize('super'), getAdmins);

router.delete('/:id', protect, authorize('super'), deleteAdmin);

// Logs & Analytics
router.get('/logs/devices', protect, getUniqueDevices);
router.get('/logs/device/:fingerprint', protect, getLogsByFingerprint);

export default router;
