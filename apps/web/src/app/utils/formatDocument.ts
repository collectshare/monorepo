export function formatDocument(value: string) {
  if (value.length === 6) {
    return value;
  }

  value = value.replace(/\D/g, '');
  return value.length === 11
    ? value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatDocumentFinal(value: string): string {
  const digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.length > 11) {
    return digitsOnly
      .slice(0, 14)
      .replace(/^(\d{2})/, '$1.')
      .replace(/^(\d{2})\.(\d{3})/, '$1.$2.')
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})/, '$1.$2.$3/')
      .replace(/\/(\d{4})(\d)/, '/$1-$2');
  }

  return digitsOnly
    .slice(0, 11)
    .replace(/^(\d{3})/, '$1.')
    .replace(/^(\d{3})\.(\d{3})/, '$1.$2.')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
}
