export function randomizeWithinRange(amount: number, percent: number) { // 10, 10
  const variance = (percent / 100) * amount; //  = 1
  const randomOffset = (Math.random() * 2 - 1) * variance; 
  return amount + randomOffset;
}
