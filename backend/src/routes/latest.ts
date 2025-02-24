import {Request, Response, Router} from 'express';
import prisma from '../prismaClient';
import {getLatestURL} from '../utils/apiUtils';
import {validateCurrency} from '../utils/validators';

const latestRouter = Router();

/**
 * @openapi
 * /latest/{currency}:
 *  get:
 *    description: Gets latest currency data
 *    parameters:
 *      - in: path
 *        name: currency
 *        required: true
 *        schema:
 *          type: string
 *        description: Currency that you want to get data for, e.g. USD, EUR
 *    responses:
 *      400:
 *        description: Bad request - invalid input.
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - type: object
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: 'No currency code provided'
 *                - type: object
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: 'No currency code'
 *      500:
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                 message:
 *                   type: string
 *                   example: 'Server error'
 *      200:
 *        description: Successfully fetched currency data
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     result:
 *                       type: string
 *                       example: 'success'
 *                     base_code:
 *                       type: string
 *                       example: 'USD'
 *                     conversion_rates:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 */
latestRouter.get(
  '/:currency',
  async (req: Request, res: Response): Promise<any> => {
    if (!req.params.currency) {
      return res.status(400).json({message: 'No currency code provided'});
    }
    if (!validateCurrency(req.params.currency)) {
      return res.status(400).json({message: 'Currency not supported'});
    }

    try {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const latestDataFromDB = await prisma.currencyDayData.findFirst({
        where: {currency: req.params.currency, date: today.getTime()},
      });

      if (latestDataFromDB) {
        console.log('Getting data from DB');
        return res.json({data: latestDataFromDB.data});
      } else {
        console.log('Getting data from API');

        const dataFromAPIReq = await fetch(getLatestURL(req.params.currency));
        const dataFromAPIRes = await dataFromAPIReq.json();

        await prisma.currencyDayData.create({
          data: {
            currency: req.params.currency,
            date: today.getTime(),
            data: dataFromAPIRes,
          },
        });

        return res.json({data: dataFromAPIRes});
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({message: 'Server error.'});
    }
  }
);

export default latestRouter;
