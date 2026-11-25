// The word a restaurant's price chip uses: what you would order there, else a plain dish.
const words: [string, string[]][] = [
  ['pizza', ['pizza']],
  ['burger', ['burger']],
  ['kebab', ['kebab']],
  ['ramen', ['ramen']],
]

export type DishWord = 'pizza' | 'burger' | 'kebab' | 'ramen' | 'dish'

export function dishWord(values: string[]): DishWord {
  const found = words.find(([, keys]) => keys.some((k) => values.includes(k)))
  return (found?.[0] as DishWord | undefined) ?? 'dish'
}
