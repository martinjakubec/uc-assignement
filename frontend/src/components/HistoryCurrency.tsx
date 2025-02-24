import {useState} from 'react';
import {CurrencySelect} from './CurrencySelect';
import {
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {createApiClient} from '../utils/apiClient';
import {HistoryGet200Response} from '../axios-client';
import {AxiosError} from 'axios';
import {Grid} from '@mui/system';
import DateSelect from './DateSelect';
import {Dayjs} from 'dayjs';
import {getBgColor} from '../utils/getBgColor';

export default function HistoryCurrency() {
  const [baseCurrency, setBaseCurrency] = useState<string>('EUR');
  const [targetCurrency, setTargetCurrency] = useState<string>('USD');

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [currencyData, setCurrencyData] =
    useState<HistoryGet200Response | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [dateWithMaxRate, setDateWithMaxRate] = useState<string | null>(null);
  const [dateWithMinRate, setDateWithMinRate] = useState<string | null>(null);

  async function fetchCurrencyData() {
    try {
      setFetchError(null);

      if (!startDate) return setFetchError('No start date selected');
      if (!endDate) return setFetchError('No end date selected');

      const axiosClient = createApiClient();
      const data = await axiosClient.historyGet(
        `${startDate.year()}-${startDate.month()}-${startDate.date()}`,
        `${endDate.year()}-${endDate.month()}-${endDate.date()}`,
        baseCurrency,
        targetCurrency
      );

      if (data.data.rates) {
        const sortedRates = data.data.rates.toSorted((a, b) => {
          return a.rate - b.rate;
        });

        setDateWithMaxRate(sortedRates[sortedRates.length - 1].date);
        setDateWithMinRate(sortedRates[0].date);
      }

      setCurrencyData(data.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setFetchError(err.response?.data.message);
      } else {
        setFetchError(null);
      }
    }
  }

  return (
    <>
      <Grid
        container
        spacing={0}
        direction="row"
        alignItems="center"
        justifyContent="space-evenly"
        gap={3}
        sx={{pb: 3}}
      >
        <Grid
          container
          spacing={0}
          direction="column"
          alignItems="end"
          justifyContent="start"
          gap={3}
        >
          <CurrencySelect
            defaultValue={baseCurrency}
            onChange={(e) => {
              setBaseCurrency(e.target.value);
            }}
            labelText="Choose base currency"
          />
          <CurrencySelect
            defaultValue={targetCurrency}
            onChange={(e) => {
              setTargetCurrency(e.target.value);
            }}
            labelText="Choose target currency"
          />
        </Grid>
        <Grid
          container
          spacing={0}
          direction="column"
          alignItems="center"
          justifyContent="start"
          gap={3}
        >
          <DateSelect onChange={setStartDate} labelText="Start date" />
          <DateSelect onChange={setEndDate} labelText="End date" />
        </Grid>
        <Grid
          container
          spacing={0}
          direction="column"
          alignItems="center"
          justifyContent="start"
          gap={3}
        >
          <Button
            onClick={fetchCurrencyData}
            variant="contained"
            color="success"
          >
            Confirm
          </Button>
        </Grid>
      </Grid>

      {fetchError && <Alert severity="error">{fetchError}</Alert>}
      {currencyData && (
        <TableContainer sx={{maxWidth: '100%', overflow: 'auto'}}>
          <Table>
            <TableHead>
              <TableRow>
                {currencyData.rates?.map((rate) => (
                  <TableCell
                    key={rate.date}
                    sx={{
                      whiteSpace: 'nowrap',
                      bgcolor: getBgColor(
                        rate.date,
                        dateWithMinRate,
                        dateWithMaxRate
                      ),
                    }}
                  >
                    {rate.date}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {currencyData.rates?.map((rate) => (
                  <TableCell
                    key={rate.date}
                    sx={{
                      bgcolor: getBgColor(
                        rate.date,
                        dateWithMinRate,
                        dateWithMaxRate
                      ),
                    }}
                  >
                    {rate.rate.toFixed(4)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
