/** Ordenação de apresentação: não altera a sequência salva dos cadastros. */
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export const compareNames = (a: string, b: string): number => collator.compare(a, b);

export function sortByName<T extends { nome: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareNames(a.nome, b.nome));
}
