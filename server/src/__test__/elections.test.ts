import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Election from '../models/Election';
import Student from '../models/Student';
import Transaction from '../models/Transaction';
import electionRoutes from '../routes/elections';
import { protect, AuthRequest } from '../middleware/auth';

// Mock the authentication middleware to bypass actual JWT validation
jest.mock('../middleware/auth', () => ({
  protect: (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    // Mock a user object for testing purposes
    req.user = { id: '60d0fe4f5311236168a109ca', role: 'teacher' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/elections', electionRoutes);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  await Election.deleteMany({});
  await Student.deleteMany({});
  await Transaction.deleteMany({});
});

describe('GET /api/elections/:id/turnout', () => {
  it('should correctly calculate total eligible voters from a single collection', async () => {
    // 1. Seed the database with test data
    const election = await Election.create({
      title: 'Test Election',
      branch: 'cs',
      section: 'a',
      admissionYear: 2024,
      createdBy: new mongoose.Types.ObjectId(),
      candidates: [],
      startTime: new Date(),
      endTime: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Create students that match the election criteria
    await Student.create([
      { name: 'Alice', usn: '1CS24CS001', email: 'alice@test.com', password: 'p', admissionYear: 2024, branch: 'cs', section: 'a' },
      { name: 'Bob', usn: '1CS24CS002', email: 'bob@test.com', password: 'p', admissionYear: 2024, branch: 'cs', section: 'a' },
      { name: 'Charlie', usn: '1CS24CS003', email: 'charlie@test.com', password: 'p', admissionYear: 2024, branch: 'cs', section: 'a' },
    ]);

    // Create a student that does NOT match the criteria (different section)
    await Student.create({ name: 'David', usn: '1CS24CS004', email: 'david@test.com', password: 'p', admissionYear: 2024, branch: 'cs', section: 'b' });

    // 2. Make the API request
    const response = await request(app).get(`/api/elections/${election._id}/turnout`);

    // 3. Assert the response
    expect(response.status).toBe(200);
    expect(response.body.totalEligibleVoters).toBe(3);
    expect(response.body.totalVotesCast).toBe(0);
    expect(response.body.voterTurnoutPercentage).toBe(0);
  });
});

describe('GET /api/elections/:id/gender-stats', () => {
  it('should correctly calculate vote statistics by gender', async () => {
    // 1. Seed data
    const candidate1Id = new mongoose.Types.ObjectId();
    const candidate2Id = new mongoose.Types.ObjectId();

    const election = await Election.create({
      title: 'Gender Stats Test',
      branch: 'cs',
      section: 'a',
      admissionYear: 2024,
      createdBy: new mongoose.Types.ObjectId(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 10 * 60 * 1000),
      candidates: [
        { student: candidate1Id, name: 'Candidate A', usn: '1' },
        { student: candidate2Id, name: 'Candidate B', usn: '2' },
      ],
    });

    const maleVoter1 = await Student.create({ name: 'Male Voter 1', usn: '3', email: 'm1@test.com', password: 'p', gender: 'male', admissionYear: 2024, branch: 'cs', section: 'a' });
    const maleVoter2 = await Student.create({ name: 'Male Voter 2', usn: '4', email: 'm2@test.com', password: 'p', gender: 'male', admissionYear: 2024, branch: 'cs', section: 'a' });
    const femaleVoter1 = await Student.create({ name: 'Female Voter 1', usn: '5', email: 'f1@test.com', password: 'p', gender: 'female', admissionYear: 2024, branch: 'cs', section: 'a' });

    // 2. Create transactions (votes)
    await Transaction.create([
      // 2 male votes for Candidate A
      { txHash: '0x1', election: election._id, student: maleVoter1._id, candidateId: candidate1Id.toString() },
      { txHash: '0x2', election: election._id, student: maleVoter2._id, candidateId: candidate1Id.toString() },
      // 1 female vote for Candidate B
      { txHash: '0x3', election: election._id, student: femaleVoter1._id, candidateId: candidate2Id.toString() },
    ]);

    // 3. Make API request
    const response = await request(app).get(`/api/elections/${election._id}/gender-stats`);

    // 4. Assert response
    expect(response.status).toBe(200);
    const candidateAStats = response.body.candidates.find((c: any) => c.candidateId === candidate1Id.toString());
    const candidateBStats = response.body.candidates.find((c: any) => c.candidateId === candidate2Id.toString());

    expect(candidateAStats.maleVotes).toBe(2);
    expect(candidateAStats.femaleVotes).toBe(0);
    expect(candidateBStats.maleVotes).toBe(0);
    expect(candidateBStats.femaleVotes).toBe(1);
    expect(response.body.nota.maleVotes).toBe(0);
    expect(response.body.nota.femaleVotes).toBe(0);
  });
});

