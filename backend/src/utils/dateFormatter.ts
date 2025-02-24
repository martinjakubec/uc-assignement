export function formatDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [{value: day}, , {value: month}, , {value: year}] =
    formatter.formatToParts(date);
  return `${year}-${month}-${day}`;
}

export function getDaysArray(start: Date, end: Date) {
  const arr: Date[] = [];
  for (const date = start; date <= end; date.setDate(date.getDate() + 1)) {
    arr.push(new Date(date));
  }
  return arr;
}
