const KEY = 'ou-mode'

// Hidden food beta: ?mode=food turns it on for the tab, ?mode=drink turns it off.
function readFoodMode(): boolean {
  const asked = new URLSearchParams(location.search).get('mode')
  try {
    if (asked === 'food') sessionStorage.setItem(KEY, 'food')
    if (asked === 'drink') sessionStorage.removeItem(KEY)
    return sessionStorage.getItem(KEY) === 'food'
  } catch {
    return asked === 'food'
  }
}

export const foodMode = readFoodMode()
