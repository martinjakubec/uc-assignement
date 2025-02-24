import {Response, Router} from 'express';
import {validateCurrency, validateDate} from '../utils/validators';
import {
  queryParamValidator,
  RequireQueryParams,
} from '../middleware/queryParamValidator';
import {getDaysArray, formatDate} from '../utils/dateFormatter';
import prisma from '../prismaClient';
import {getHistoricURL} from '../utils/apiUtils';
import {randomizeWithinRange} from '../utils/mathUtils';

export interface HistoryResponse {
  baseCurrency: string;
  targetCurrency: string;
  rates: {date: string; rate: number}[];
}

const historyRouter = Router();

const REQUIRED_HISTORY_QUERY_PARAMS = [
  'startDate',
  'endDate',
  'baseCurrency',
  'targetCurrency',
];

/**
 * @openapi
 * /history:
 *  get:
 *    description: Gets historical currency data between two dates (inclusive) for two currencies
 *    parameters:
 *      - in: query
 *        name: startDate
 *        required: true
 *        schema:
 *          type: string
 *        description: Start date for the query, format YYYY-MM-DD
 *      - in: query
 *        name: endDate
 *        required: true
 *        schema:
 *          type: string
 *        description: End date for the query, format YYYY-MM-DD
 *      - in: query
 *        name: baseCurrency
 *        required: true
 *        schema:
 *          type: string
 *        description: Currency that you want to get data for, e.g. USD, EUR
 *      - in: query
 *        name: targetCurrency
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
 *                      example: 'Invalid Start date'
 *                - type: object
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: 'Invalid End date'
 *                - type: object
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: 'Invalid Base Currency'
 *                - type: object
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: 'Invalid Target Currency'
 *                - type: object
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: 'Cannot query into the future'
 *                - type: object
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: 'End Date cannot be lower than Start Date'
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
 *        description: Successfully fetched historical currency data
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                baseCurrency:
 *                  type: string
 *                  example: 'USD'
 *                targetCurrency:
 *                  type: string
 *                  example: 'USD'
 *                rates:
 *                  type: array
 *                  items:
 *                    type: object
 *                    required: 
 *                      - date 
 *                      - rate 
 *                    properties:
 *                      date:
 *                        type: string
 *                        example: 2022-02-02
 *                      rate:
 *                        type: number
 *                        example: 1.11111
 */
historyRouter.get(
  '/',
  queryParamValidator(REQUIRED_HISTORY_QUERY_PARAMS),
  async (
    req: RequireQueryParams<typeof REQUIRED_HISTORY_QUERY_PARAMS>,
    res: Response
  ): Promise<any> => {
    const {startDate, endDate, baseCurrency, targetCurrency} = req.query;

    if (!validateDate(new Date(startDate!.toString())))
      return res.status(400).json({message: 'Invalid Start date'});

    if (!validateDate(new Date(endDate!.toString())))
      return res.status(400).json({message: 'Invalid End date'});

    if (!validateCurrency(baseCurrency!.toString()))
      return res.status(400).json({message: 'Invalid Base Currency'});

    if (!validateCurrency(targetCurrency!.toString()))
      return res.status(400).json({message: 'Invalid Target Currency'});

    if (new Date(endDate) > new Date())
      return res.status(400).json({message: 'Cannot query into the future'});

    if (new Date(startDate) > new Date(endDate))
      return res
        .status(400)
        .json({message: 'End Date cannot be lower than Start Date'});

    try {
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(12, 0, 0, 0);

      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(12, 0, 0, 0);

      const allDates = getDaysArray(adjustedStartDate, adjustedEndDate).map(
        (date) => {
          date.setHours(12, 0, 0, 0);
          return date;
        }
      );

      const dataFromDB = (
        await prisma.currencyDayData.findMany({
          where: {
            currency: baseCurrency.toString(),
            date: {
              in: allDates.map((date) => date.getTime()),
            },
          },
        })
      ).map((data) => {
        return {...data, date: Number(data.date), source: 'db'};
      });

      const missingDays = allDates.filter((date) => {
        if (dataFromDB.find((dbData) => dbData.date == date.getTime())) {
          return false;
        }
        return true;
      });

      const results: any[] = (
        await Promise.all(
          missingDays.map(async (missingDate) => {
            return (
              await fetch(getHistoricURL(baseCurrency, missingDate))
            ).json();
          })
        )
      )
        // filter out free API key error responses
        .filter((singleCurrencyData) => {
          return singleCurrencyData.result !== 'error';
        })
        // reshapes data so it is in the same format as the data coming from DB
        .map((successfulData) => {
          const date = new Date();
          date.setFullYear(
            successfulData.year,
            successfulData.month - 1,
            successfulData.day
          );
          date.setHours(12, 0, 0, 0);
          return {
            currency: baseCurrency,
            data: successfulData,
            date: date.getTime(),
            source: 'api',
          };
        })
        // saves the data from API to database for future queries
        .map((reshapedData) => {
          if (reshapedData.source == 'db') return reshapedData;
          prisma.currencyDayData.create({
            data: {
              currency: baseCurrency,
              data: reshapedData.data,
              date: reshapedData.date,
            },
          });
          return reshapedData;
        })
        .concat(dataFromDB);

      // simulating responses from history API because free API key does not have access to history endpoint - if you have a premium API key, you can ignore this section by setting API_KEY_TIER to something else than free
      if (process.env.API_KEY_TIER == 'free') {
        for (let i = 0; i < missingDays.length; i++) {
          const dummyConversionRates = {};
          for (let key of Object.keys(
            exampleResultFromDB.data.conversion_rates
          )) {
            if (key !== baseCurrency) {
              dummyConversionRates[key] = randomizeWithinRange(
                exampleResultFromDB.data.conversion_rates[key],
                10
              );
            } else {
              dummyConversionRates[key] = 1;
            }
          }
          results.push({
            currency: baseCurrency,
            date: missingDays[i],
            data: {
              ...exampleResultFromDB.data,
              conversion_rates: dummyConversionRates,
            },
          });
        }
      }

      return res.json(
        results.reduce<HistoryResponse>(
          (prev, next) => {
            return {
              ...prev,
              rates: prev.rates.concat({
                date: formatDate(new Date(next.date)),
                rate: next.data?.conversion_rates[targetCurrency],
              }),
            };
          },
          {
            baseCurrency,
            targetCurrency,
            rates: [],
          }
        )
      );
    } catch (err) {
      console.log(err);
      return res.status(500).json({message: 'Server error.'});
    }
  }
);

export default historyRouter;

const exampleResultFromDB = {
  currency: 'USD',
  date: 1740064329020n,
  data: {
    result: 'success',
    base_code: 'USD',
    terms_of_use: 'https://www.exchangerate-api.com/terms',
    documentation: 'https://www.exchangerate-api.com/docs',
    conversion_rates: {
      AED: 3.6725,
      AFN: 73.7594,
      ALL: 94.996,
      AMD: 396.4649,
      ANG: 1.79,
      AOA: 920.2889,
      ARS: 1059.38,
      AUD: 1.5756,
      AWG: 1.79,
      AZN: 1.7001,
      BAM: 1.8763,
      BBD: 2,
      BDT: 121.5099,
      BGN: 1.8761,
      BHD: 0.376,
      BIF: 2966.4628,
      BMD: 1,
      BND: 1.3425,
      BOB: 6.9314,
      BRL: 5.7068,
      BSD: 1,
      BTN: 86.9444,
      BWP: 13.8413,
      BYN: 3.2706,
      BZD: 2,
      CAD: 1.4226,
      CDF: 2856.593,
      CHF: 0.9042,
      CLP: 949.6064,
      CNY: 7.2833,
      COP: 4103.9364,
      CRC: 506.2286,
      CUP: 24,
      CVE: 105.7822,
      CZK: 24.0828,
      DJF: 177.721,
      DKK: 7.1567,
      DOP: 62.2151,
      DZD: 135.0055,
      EGP: 50.6188,
      ERN: 15,
      ETB: 127.1346,
      EUR: 0.9594,
      FJD: 2.2964,
      FKP: 0.7944,
      FOK: 7.1563,
      GBP: 0.7945,
      GEL: 2.8168,
      GGP: 0.7944,
      GHS: 15.5534,
      GIP: 0.7944,
      GMD: 72.6177,
      GNF: 8631.9641,
      GTQ: 7.7228,
      GYD: 210.0302,
      HKD: 7.7772,
      HNL: 25.5728,
      HRK: 7.2282,
      HTG: 131.1428,
      HUF: 385.9553,
      IDR: 16357.8513,
      ILS: 3.5445,
      IMP: 0.7944,
      INR: 86.9495,
      IQD: 1310.5526,
      IRR: 41994.1949,
      ISK: 140.5371,
      JEP: 0.7944,
      JMD: 157.6245,
      JOD: 0.709,
      JPY: 151.499,
      KES: 129.24,
      KGS: 87.4259,
      KHR: 4016.4105,
      KID: 1.5754,
      KMF: 471.9669,
      KRW: 1440.8242,
      KWD: 0.3089,
      KYD: 0.8333,
      KZT: 502.5209,
      LAK: 21846.6298,
      LBP: 89500,
      LKR: 296.4747,
      LRD: 199.4526,
      LSL: 18.5255,
      LYD: 4.8931,
      MAD: 9.9825,
      MDL: 18.6688,
      MGA: 4739.1675,
      MKD: 58.9363,
      MMK: 2100.6407,
      MNT: 3444.9998,
      MOP: 8.0105,
      MRU: 39.9204,
      MUR: 46.4997,
      MVR: 15.4652,
      MWK: 1740.5872,
      MXN: 20.427,
      MYR: 4.4418,
      MZN: 63.9932,
      NAD: 18.5255,
      NGN: 1506.8265,
      NIO: 36.8236,
      NOK: 11.1404,
      NPR: 139.111,
      NZD: 1.7529,
      OMR: 0.3845,
      PAB: 1,
      PEN: 3.6853,
      PGK: 4.028,
      PHP: 58.117,
      PKR: 279.395,
      PLN: 4.0005,
      PYG: 7899.6448,
      QAR: 3.64,
      RON: 4.768,
      RSD: 112.3288,
      RUB: 90.0818,
      RWF: 1431.057,
      SAR: 3.75,
      SBD: 8.6452,
      SCR: 14.6915,
      SDG: 544.675,
      SEK: 10.731,
      SGD: 1.3426,
      SHP: 0.7944,
      SLE: 22.8566,
      SLL: 22856.6481,
      SOS: 572.0792,
      SRD: 35.6294,
      SSP: 4415.809,
      STN: 23.504,
      SYP: 12977.7073,
      SZL: 18.5255,
      THB: 33.7111,
      TJS: 10.9326,
      TMT: 3.5025,
      TND: 3.1734,
      TOP: 2.386,
      TRY: 36.3254,
      TTD: 6.7718,
      TVD: 1.5754,
      TWD: 32.7565,
      TZS: 2583.9549,
      UAH: 41.7015,
      UGX: 3678.4774,
      USD: 1,
      UYU: 43.2826,
      UZS: 12972.908,
      VES: 62.5107,
      VND: 25527.2982,
      VUV: 123.197,
      WST: 2.8123,
      XAF: 629.2892,
      XCD: 2.7,
      XDR: 0.7638,
      XOF: 629.2892,
      XPF: 114.4806,
      YER: 247.8036,
      ZAR: 18.5272,
      ZMW: 28.2409,
      ZWL: 26.4561,
    },
    time_last_update_utc: 'Thu, 20 Feb 2025 00:00:01 +0000',
    time_next_update_utc: 'Fri, 21 Feb 2025 00:00:01 +0000',
    time_last_update_unix: 1740009601,
    time_next_update_unix: 1740096001,
  },
};
