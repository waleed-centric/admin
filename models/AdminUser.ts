import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
}

const AdminUserSchema: Schema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true,
    strict: true,
  }
);

const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);

export default AdminUser;
