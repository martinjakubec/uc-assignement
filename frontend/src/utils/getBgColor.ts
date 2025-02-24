import {green, red} from '@mui/material/colors';

export function getBgColor(
  date: string,
  dateWithMin: string | null,
  dateWithMax: string | null
) {
  if (date == dateWithMin) return red[300];
  if (date == dateWithMax) return green[300];
}
