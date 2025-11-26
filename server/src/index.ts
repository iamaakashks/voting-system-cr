import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './db';
import authRoutes from './routes/auth';
import electionRoutes from './routes/elections';
import studentRoutes from './routes/students';
import voteRoutes from './routes/vote';
import transactionRoutes from './routes/transactions';
import ticketRoutes from './routes/tickets';
import cryptoRoutes from './routes/crypto';
import { startElectionScheduler } from './utils/electionScheduler';

// Connect to Database
connectDB();

const app = express();
const httpServer = http.createServer(app);

const corsOptions = {
  origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

export const io = new Server(httpServer, {
  cors: corsOptions
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`✓ Socket connected: ${socket.id}`);
  console.log(`✓ Total connections: ${io.engine.clientsCount}`);
  
  socket.on('disconnect', () => {
    console.log(`✗ Socket disconnected: ${socket.id}`);
    console.log(`✓ Total connections: ${io.engine.clientsCount}`);
  });
});

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.send('VeriVote API Running');
});

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/crypto', cryptoRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server with socket.io started on port ${PORT}`);
  // Start the election scheduler
  startElectionScheduler(io);
});
