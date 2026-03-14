import mongoose from 'mongoose';

const requestLogSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  headers: {
    type: Object,
  },
  body: {
    type: Object,
  },
  query: {
    type: Object,
  },
  ip: {
    type: String,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  clientFingerprint: {
    type: String,
    default: null,
  },
  serverFingerprint: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for faster lookups
requestLogSchema.index({ clientFingerprint: 1 });
requestLogSchema.index({ serverFingerprint: 1 });
// TTL Index: Automatically delete logs older than 30 days (2592000 seconds)
requestLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const RequestLog = mongoose.model('RequestLog', requestLogSchema);

export default RequestLog;
