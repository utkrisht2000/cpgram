import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { runMigrations } from './db/migrations/runMigrations';
import { authRouter } from './api/auth.routes';
import { departmentsRouter } from './api/departments.routes';
import { grievancesRouter } from './api/grievances.routes';
import { officersRouter } from './api/officers.routes';
import { chatRouter } from './api/chat.routes';
import { errorHandler } from './middleware/errorHandler';

// Initialize and execute SQLite migrations
try {
  runMigrations();
  console.log('[SuGam Backend] Database migrations applied successfully.');
} catch (err: any) {
  console.error('[SuGam Backend] Database migration error:', err);
  process.exit(1);
}

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'SuGam Grievance Redressal Platform',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API route handlers
app.use('/api/auth', authRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/grievances', grievancesRouter);
app.use('/api/officers', officersRouter);
app.use('/api/chat', chatRouter);

// Global Error Handler Middleware
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`[SuGam Backend] Service operational on port ${env.port} (${env.nodeEnv})`);
});

export default app;
