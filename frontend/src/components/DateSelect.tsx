import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {Dayjs} from 'dayjs';

interface DateSelectProps {
  onChange: (value: Dayjs | null) => void;
  labelText?: string;
}

export default function DateSelect({onChange, labelText}: DateSelectProps) {
  return (
    <>
      <DatePicker
        onChange={(value) => {
          console.log(value?.year(), value?.month(), value?.date());
          onChange(value);
        }}
        label={labelText}
      />
    </>
  );
}
