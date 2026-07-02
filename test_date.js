const isPeriodExpired = (period) => {
  if (!period || period === 'null') return false;
  
  const match = period.match(/a\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    return new Date() > endDate;
  }
  return false;
};

console.log(isPeriodExpired("01/07/2026 a 07/07/2026")); // Should be false if today is 05/07
console.log(isPeriodExpired("01/06/2026 a 07/06/2026")); // Should be true if today is 05/07
