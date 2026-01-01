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
import adminRoutes from './routes/admin';
import { startElectionScheduler } from './utils/electionScheduler';
import { enforceHTTPS } from './middleware/httpsRedirect';

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

// Middleware - Security Headers with helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:3000'],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Socket.IO compatibility
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  noSniff: true, // X-Content-Type-Options
  xssFilter: true, // X-XSS-Protection
  hidePoweredBy: true, // Remove X-Powered-By header
}));

app.use(cors(corsOptions));
app.use(express.json());

// HTTPS redirect in production
app.use(enforceHTTPS);

// Socket.IO connection with room-based broadcasting for scalability
io.on('connection', (socket) => {
  console.log(`✓ Socket connected: ${socket.id}`);
  console.log(`✓ Total connections: ${io.engine.clientsCount}`);
  
  // Join election-specific room to reduce broadcast overhead
  socket.on('join:election', (electionId: string) => {
    socket.join(`election:${electionId}`);
    console.log(`Socket ${socket.id} joined election room: ${electionId}`);
  });
  
  // Leave election room when navigating away
  socket.on('leave:election', (electionId: string) => {
    socket.leave(`election:${electionId}`);
    console.log(`Socket ${socket.id} left election room: ${electionId}`);
  });
  
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
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server with socket.io started on port ${PORT}`);
  // Start the election scheduler
  startElectionScheduler(io);
});
