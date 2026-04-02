export const formatBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const parseBRL = (value: string): number => {
  return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
};
