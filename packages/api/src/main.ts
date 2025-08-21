import express from 'express';
import { createResponse } from '@nx-sandbox/common';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.get('/', (req, res) => {
  res.send(createResponse({ message: 'Hello API' }));
});

app.get('/health', (req, res) => {
  res.send(createResponse({ status: 'healthy' }));
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
