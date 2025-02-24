import express, {Request, Response} from 'express';
import latestRouter from './routes/latest';
import historyRouter from './routes/history';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import currencyRouter from './routes/supportedCurrencies';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({path: '../.env'});

const app = express();
const port = process.env.APP_PORT;

app.use(cors({origin: '*'}));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [{url: 'http://localhost:8080'}],
  },
  apis: [path.join(__dirname, 'routes', '*.[t|j]s')],
};

const specs = swaggerJsdoc(options);

app.use('/openapi-ui', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/openapi.json', (req, res) => {
  res.json(specs);
  return;
});

app.use('/supported-currencies', currencyRouter);
app.use('/latest', latestRouter);
app.use('/history', historyRouter);

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server listening at por ${port}`);
});
