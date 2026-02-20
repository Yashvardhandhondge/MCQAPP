const mongoose = require('mongoose');

const paymentEventLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['webhook', 'verify'],
      default: 'webhook',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    orderId: { type: String, default: null },
    paymentId: { type: String, default: null },
    amount: { type: Number, default: null },
    planId: { type: String, enum: ['PCM', 'PCB', 'PCMB'], default: null },
    payloadSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

paymentEventLogSchema.index({ createdAt: -1 });
paymentEventLogSchema.index({ userId: 1, createdAt: -1 });
paymentEventLogSchema.index({ event: 1 });

const PaymentEventLog = mongoose.model('PaymentEventLog', paymentEventLogSchema);
module.exports = PaymentEventLog;
