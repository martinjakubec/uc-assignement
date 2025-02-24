export function getLatestURL(currency: string) {
  return `${process.env.EXCHANGE_API_URL}/${process.env.EXCHANGE_API_KEY}/latest/${currency}`;
}

export function getHistoricURL(currency: string, date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${process.env.EXCHANGE_API_URL}/${process.env.EXCHANGE_API_KEY}/history/${currency}/${year}/${month}/${day}`;
}
