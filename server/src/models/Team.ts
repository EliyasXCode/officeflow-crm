import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamDocument extends Document {
  name: string;
  description?: string;
  managerId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeamDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  {
    timestamps: true,
  }
);

export const Team = mongoose.model<ITeamDocument>('Team', TeamSchema);
