import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './config/cors.js';
import { env, isTest } from './config/env.js';
import { API_PREFIX } from './constants/enums.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { requestId } from './middleware/requestId.js';
import routes from './routes/index.js';

// Express only. server.js starts listening, so tests can import this without opening a port.
const app = express();

app.set('trust proxy', env.TRUST_PROXY);

app.use(requestId);
app.use(helmet());
app.use(cors(corsOptions));

if (!isTest) {
  morgan.token('id', (req) => req.id);
  app.use(morgan(':id :method :url :status :response-time ms'));
}

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use(API_PREFIX, globalLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
