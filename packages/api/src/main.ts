import express from 'express';
import { createResponse } from '@nx-sandbox/common';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

// Refactor: centralize standard JSON response shape
function sendOk<T>(res: express.Response, body: T) {
  res.send(createResponse(body));
}

app.get('/', (req, res) => {
  sendOk(res, { message: 'Hello API' });
});

app.get('/health', (req, res) => {
  sendOk(res, { status: 'healthy' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
