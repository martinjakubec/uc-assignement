import {Router} from 'express';
import {supportedCountryCodes} from '../utils/countryCodes';

const currencyRouter = Router();

/**
 * @openapi
 * /supported-currencies:
 *  get:
 *    description: Gets list of supported currencies by the external API
 *    responses:
 *      200:
 *        description: List of supported currencies
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: string
 *                example: 'USD'
 */
currencyRouter.get('/', (req, res) => {
  res.json(supportedCountryCodes);
  return;
});

export default currencyRouter;
