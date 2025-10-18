export function currencyStringToNumber(value: string | number) {
  if (typeof value === 'number') {
    return value;
  }

  const sanitizedString = value.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
  return Number(sanitizedString);
}
