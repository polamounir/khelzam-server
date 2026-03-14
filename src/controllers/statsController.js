import Admin from '../models/Admin.js';
import Exam from '../models/Exam.js';
import Submission from '../models/Submission.js';
import RequestLog from '../models/RequestLog.js';

// @desc    Get all application statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAppStats = async (req, res) => {
  try {
    // 1. Admin/User Stats
    const totalAdmins = await Admin.countDocuments();
    const normalAdmins = await Admin.countDocuments({ role: 'normal' });
    const superAdmins = await Admin.countDocuments({ role: 'super' });
    
    // Unique Students (based on deviceFingerprint in submissions)
    const uniqueStudents = await Submission.distinct('deviceFingerprint');
    const studentCount = uniqueStudents.length;

    // 2. Exam Stats
    const totalExams = await Exam.countDocuments();
    const examStats = await Exam.aggregate([
      { $group: { _id: null, totalQuestions: { $sum: { $size: { $ifNull: ["$questions", []] } } } } }
    ]);
    const totalQuestions = examStats[0]?.totalQuestions || 0;

    // 3. Submission Stats (Aggregated)
    const submissionStats = await Submission.aggregate([
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          avgScore: { $avg: '$score' }, // This might need careful handling depending on possible max scores
          totalTabExits: { $sum: '$tabExitCount' },
          totalIntegrityEvents: { $sum: { $size: { $ifNull: ['$integrityEvents', []] } } },
        }
      }
    ]);

    const stats = submissionStats[0] || {
      totalSubmissions: 0,
      avgScore: 0,
      totalTabExits: 0,
      totalIntegrityEvents: 0
    };

    // 4. Log/Device Stats
    const totalRequests = await RequestLog.countDocuments();
    const uniqueDevices = await RequestLog.distinct('serverFingerprint');
    
    // 5. Timeline (Submissions per day - Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const timeline = await Submission.aggregate([
      { $match: { submittedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      users: {
        totalAdmins,
        normalAdmins,
        superAdmins,
        studentCount
      },
      exams: {
        totalExams,
        totalQuestions
      },
      submissions: {
        totalSubmissions: stats.totalSubmissions,
        avgScore: stats.avgScore?.toFixed(2) || 0,
        totalTabExits: stats.totalTabExits,
        totalIntegrityEvents: stats.totalIntegrityEvents,
        timeline
      },
      activity: {
        totalRequests,
        uniqueDeviceCount: uniqueDevices.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getAppStats };
