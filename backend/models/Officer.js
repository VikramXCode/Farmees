import mongoose from 'mongoose';

const OfficerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: { type: String, default: 'Agriculture Officer' },
    district: { type: String, index: true },
    state: { type: String, index: true },
    email: { type: String },
    phone: { type: String },
    officeAddress: { type: String },
    isActive: { type: Boolean, default: true },
    coverage: {
      type: {
        districts: [{ type: String }],
        states: [{ type: String }],
      },
      default: undefined,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Officer', OfficerSchema);

