import { useTheme } from '../context/ThemeContext'

const BASE = import.meta.env.BASE_URL + 'logos'

/**
 * Returns the correct logo path based on current theme.
 * Usage: const src = useThemedLogo('energy') → "/filatex-dashboard/logos/dark/energy.svg"
 */
export function useThemedLogo(name) {
  const { theme } = useTheme()
  return `${BASE}/${theme}/${name}.svg`
}

/**
 * Returns both logo paths for cases where you need both.
 */
export function useThemedLogos() {
  const { theme } = useTheme()
  const folder = `${BASE}/${theme}`
  return {
    filatex: `${folder}/filatex.svg`,
    energy: `${folder}/energy.svg`,
    investments: `${folder}/investments.svg`,
    properties: `${folder}/properties.svg`,
  }
}
