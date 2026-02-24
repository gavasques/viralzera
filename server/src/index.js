import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import entityRoutes from './routes/entities.js';
import functionRoutes from './routes/functions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Health endpoints (requerido pelo Docker healthcheck)
app.get('/_health', (req, res) => {
  res.status(200).send('ok');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/functions', functionRoutes);

// Servir frontend em produção (Express serve o build do Vite)
if (process.env.NODE_ENV === 'production') {
  // O Dockerfile copia o build do frontend para /app/dist (raiz do container)
  // O server roda em /app/src/index.js → dist fica em /app/dist
  const distPath = path.resolve(__dirname, '..', '..', 'dist');

  // Assets com hash → cache longo (1 ano)
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));

  // Demais arquivos estáticos
  app.use(express.static(distPath));

  // SPA fallback — qualquer rota que não seja /api devolve index.html
  app.use('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
