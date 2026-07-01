import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import residentRoutes from './routes/resident.routes.js';
import bhwRoutes from './routes/bhw.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Bind API Routing Matrix Modules
app.use('/api/residents', residentRoutes);
app.use('/api/bhws', bhwRoutes);
app.use('/api/analytics', analyticsRoutes);

// Base Check Root Route
app.get('/', (req, res) => {
  res.status(200).json({ system: "CitiCare Backend", status: "Operational" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[CitiCare Server Engine Running on port ${PORT}]`);
});