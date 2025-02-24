import {supportedCountryCodes} from './countryCodes';

export function validateDate(date: Date): boolean {
  if (isNaN(date.getTime())) return false;
  else return true;
}

export function validateCurrency(currency: string): boolean {
  if (supportedCountryCodes.indexOf(currency) == -1) return false;
  return true;
}
