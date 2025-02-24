import {useEffect, useState} from 'react';
import {CurrencySelect} from './CurrencySelect';
import {
  Alert,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import {createApiClient} from '../utils/apiClient';
import {LatestCurrencyGet200ResponseData} from '../axios-client';
import {AxiosError} from 'axios';

export default function SingleCurrency() {
  const [baseCurrency, setBaseCurrency] = useState<string>('EUR');
  const [currencyData, setCurrencyData] =
    useState<LatestCurrencyGet200ResponseData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  function handleCurrencyChange(e: SelectChangeEvent) {
    setBaseCurrency(e.target.value);
  }

  useEffect(() => {
    async function fetchCurrencyData() {
      try {
        setFetchError(null);
        const axiosClient = createApiClient();
        const request = await axiosClient.latestCurrencyGet(baseCurrency);
        setCurrencyData(request.data.data || null);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setFetchError(err.response?.data.message);
        } else {
          setFetchError(null);
        }
      }
    }
    fetchCurrencyData();
  }, [baseCurrency]);

  return (
    <>
      <CurrencySelect
        defaultValue={baseCurrency}
        onChange={handleCurrencyChange}
      />
      {fetchError && <Alert severity="error">{fetchError}</Alert>}
      {currencyData && (
        <TableContainer sx={{maxHeight: 700, overflow: 'auto'}}>
          <Table>
            <TableBody>
              {currencyData &&
                currencyData.conversion_rates &&
                Object.keys(currencyData.conversion_rates).map((currName) => {
                  if (currName !== baseCurrency) {
                    return (
                      <TableRow key={currName}>
                        <TableCell>{currName}</TableCell>
                        <TableCell>
                          {currencyData.conversion_rates?.[currName]}
                        </TableCell>
                      </TableRow>
                    );
                  }
                })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
