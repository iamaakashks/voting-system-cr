import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// Interface for the Ticket Document (an instance)
export interface ITicket extends Document {
  election: Schema.Types.ObjectId;
  student: Schema.Types.ObjectId;
  ticketString: string;
  used: boolean;
  expiresAt: Date;
}

// Interface for the Ticket Model (static methods)
export interface ITicketModel extends Model<ITicket> {
  generateTicket(length?: number): string;
}

const TicketSchema: Schema = new Schema({
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  ticketString: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

TicketSchema.index({ election: 1, student: 1 }, { unique: true });

// Helper to generate a random ticket string
TicketSchema.statics.generateTicket = (length = 10): string => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
};

export default mongoose.model<ITicket, ITicketModel>('Ticket', TicketSchema);