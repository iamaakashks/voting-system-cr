import { Server } from 'socket.io';
import Election, { IElection } from '../models/Election';

const CHECK_INTERVAL = 60 * 1000; // 60 seconds

export const startElectionScheduler = (io: Server) => {
  console.log('Election scheduler started.');

  setInterval(async () => {
    const now = new Date();

    try {
      // Find elections that are pending and should start
      const electionsToStart: IElection[] = await Election.find({
        startTime: { $lte: now },
        status: 'Pending'
      });

      for (const election of electionsToStart) {
        (election as IElection).status = 'Ongoing';
        await election.save();
        io.emit('election:started', { electionId: (election as any)._id.toString() });
        console.log(`Election started: ${(election as any).title} (${(election as any)._id})`);
      }

      // Find elections that are ongoing and should end
      const electionsToEnd: IElection[] = await Election.find({
        endTime: { $lte: now },
        status: 'Ongoing'
      });

      for (const election of electionsToEnd) {
        (election as IElection).status = 'Finished';
        await election.save();
        io.emit('election:ended', { electionId: (election as any)._id.toString() });
        console.log(`Election ended: ${(election as any).title} (${(election as any)._id})`);
      }

    } catch (error) {
      console.error('Error in election scheduler:', error);
    }
  }, CHECK_INTERVAL);
};
