import RequestLog from '../models/RequestLog.js';
import Submission from '../models/Submission.js';
import Exam from '../models/Exam.js'; // Ensure Exam is available for population

// @desc    Get all unique device fingerprints (Aggregated by Server Fingerprint)
// @route   GET /api/admin/logs/devices
// @access  Private (Admin)
const getUniqueDevices = async (req, res) => {
  try {
    const devices = await RequestLog.aggregate([
      {
        $group: {
          _id: '$serverFingerprint',
          clientFingerprints: { $addToSet: '$clientFingerprint' },
          uniqueIps: { $addToSet: '$ip' },
          userAgents: { $addToSet: { $ifNull: ['$headers.user-agent', 'Unknown'] } },
          lastIp: { $last: '$ip' },
          firstSeen: { $min: '$createdAt' },
          lastSeen: { $max: '$createdAt' },
          requestCount: { $sum: 1 },
        }
      },
      { 
        $project: {
          _id: 1,
          clientFingerprints: {
            $filter: {
              input: '$clientFingerprints',
              as: 'fp',
              cond: { $ne: ['$$fp', null] }
            }
          },
          uniqueIps: 1,
          userAgents: 1,
          lastIp: 1,
          firstSeen: 1,
          lastSeen: 1,
          requestCount: 1,
          ipCount: { $size: '$uniqueIps' },
          userAgentCount: { $size: '$userAgents' }
        }
      },
      { $sort: { lastSeen: -1 } }
    ]);

    // Enrich each device with submission data
    const enrichedDevices = await Promise.all(devices.map(async (device) => {
      // Find submissions that match this server fingerprint or any of its client fingerprints
      const fingerPrintsToMatch = [device._id, ...device.clientFingerprints];
      
      const submissions = await Submission.find({
        deviceFingerprint: { $in: fingerPrintsToMatch }
      });

      const totalTabExits = submissions.reduce((sum, s) => sum + (s.tabExitCount || 0), 0);
      const totalIntegrityEvents = submissions.reduce((sum, s) => sum + (s.integrityEvents?.length || 0), 0);
      const usernames = [...new Set(submissions.map(s => s.userName))];

      return {
        ...device,
        submissionCount: submissions.length,
        usernames,
        integritySummary: {
          totalTabExits,
          totalIntegrityEvents,
          isSuspected: totalTabExits > 5 || totalIntegrityEvents > 5,
        }
      };
    }));

    res.json(enrichedDevices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logs for a specific device fingerprint (Search both client and server)
// @route   GET /api/admin/logs/device/:fingerprint
// @access  Private (Admin)
const getLogsByFingerprint = async (req, res) => {
  try {
    const fingerprint = req.params.fingerprint;
    const logs = await RequestLog.find({
      $or: [
        { clientFingerprint: fingerprint },
        { serverFingerprint: fingerprint }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Fetch submissions for this device
    const submissions = await Submission.find({ deviceFingerprint: fingerprint })
      .populate('examId', 'title')
      .sort({ submittedAt: -1 })
      .lean();

    // Calculate integrity summary
    const totalTabExits = submissions.reduce((sum, s) => sum + (s.tabExitCount || 0), 0);
    const totalIntegrityEvents = submissions.reduce((sum, s) => sum + (s.integrityEvents?.length || 0), 0);
    const associatedUsernames = [...new Set(submissions.map(s => s.userName))];

    // Create a summary for the fingerprint
    const summary = {
      totalFound: logs.length,
      firstSeen: logs.length > 0 ? logs[logs.length - 1].createdAt : null,
      lastSeen: logs.length > 0 ? logs[0].createdAt : null,
      uniqueIps: [...new Set(logs.map(log => log.ip))],
      methods: [...new Set(logs.map(log => log.method))],
      // Integrity & Submission Data
      submissionCount: submissions.length,
      associatedUsernames,
      integritySummary: {
        totalTabExits,
        totalIntegrityEvents,
        isSuspected: totalTabExits > 5 || totalIntegrityEvents > 5,
      }
    };

    res.json({ summary, submissions, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getUniqueDevices,
  getLogsByFingerprint
};
