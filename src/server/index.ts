import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  }),
);
app.use(bodyParser.json());

// Static Files (영상 재생용)
app.use('/output', express.static(path.join(process.cwd(), 'output')));
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
