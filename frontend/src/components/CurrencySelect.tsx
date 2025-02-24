import {useEffect, useState} from 'react';
import {createApiClient} from '../utils/apiClient';
import {InputLabel, MenuItem, Select, SelectChangeEvent} from '@mui/material';
import {Box, Grid} from '@mui/system';

interface CurrencySelectProps {
  onChange: (e: SelectChangeEvent<string>) => void;
  defaultValue: string;
  labelText?: string;
}

export function CurrencySelect({
  onChange,
  defaultValue,
  labelText = 'Choose currency: ',
}: CurrencySelectProps) {
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>();

  useEffect(() => {
    const apiClient = createApiClient();
    async function fetchCurrencies() {
      const data = await apiClient.supportedCurrenciesGet();
      setSupportedCurrencies(data.data);
    }
    fetchCurrencies();
  }, []);

  return (
    <Grid
      container
      spacing={0}
      direction="row"
      alignItems="center"
      justifyContent="start"
      gap={3}
    >
      <InputLabel>{labelText}</InputLabel>
      <Select
        sx={{marginY: 'auto'}}
        variant="standard"
        defaultValue={defaultValue}
        onChange={onChange}
      >
        {supportedCurrencies?.map((curr) => {
          return (
            <MenuItem value={curr} key={curr}>
              {curr}
            </MenuItem>
          );
        })}
      </Select>
    </Grid>
  );
}
