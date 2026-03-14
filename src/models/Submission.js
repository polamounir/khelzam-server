import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  deviceFingerprint: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
  },
  tabExitCount: {
    type: Number,
    default: 0,
  },
  tabReturnCount: {
    type: Number,
    default: 0,
  },
  integrityEvents: {
    type: Array,
    default: [],
  },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  score: {
    type: Number,
    default: 0,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Prevent duplicate submissions from same device for same exam
submissionSchema.index({ examId: 1, deviceFingerprint: 1 }, { unique: true });
submissionSchema.index({ deviceFingerprint: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
