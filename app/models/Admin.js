import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true }, // Must be unique if it exists
  password: { type: String, select: false }, // Do not return password in queries by default
  isSetupComplete: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false }
}, { timestamps: true });

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);