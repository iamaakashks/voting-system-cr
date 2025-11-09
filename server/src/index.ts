import express from 'express';
import cors from 'cors';
import connectDB from './db';
import authRoutes from './routes/auth';
import electionRoutes from './routes/elections';
import studentRoutes from './routes/students';

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('VeriVote API Running');
});

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/students', studentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));