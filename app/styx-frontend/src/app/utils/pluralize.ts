export const pluralize = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`
