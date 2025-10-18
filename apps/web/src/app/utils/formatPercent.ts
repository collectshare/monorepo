export function formatPercent(value: number) {
  return Math.abs(value).toLocaleString('pt-BR', { style: 'percent', maximumFractionDigits: 2 });
}
