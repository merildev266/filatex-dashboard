import { createContext, useReducer } from 'react'
import { currentIsoWeek } from '../utils/weekUtils'

const now = new Date()
const iso = currentIsoWeek()

const initialState = {
  currentFilter: 'M',  // 'S' | 'M' | 'Q' | 'A'
  selectedMonthIndex: now.getMonth(),
  selectedQuarter: Math.floor(now.getMonth() / 3) + 1,
  selectedYear: now.getFullYear(),
  selectedWeek: iso.week,       // ISO week number (1..53)
  selectedWeekYear: iso.year,   // ISO year (peut differer de l'annee calendaire aux limites)
}

function filterReducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, currentFilter: action.payload }
    case 'SET_MONTH':
      return { ...state, selectedMonthIndex: action.payload }
    case 'SET_QUARTER':
      return { ...state, selectedQuarter: action.payload }
    case 'SET_YEAR':
      return { ...state, selectedYear: action.payload }
    case 'SET_WEEK':
      // payload = { week, year }
      return { ...state, selectedWeek: action.payload.week, selectedWeekYear: action.payload.year }
    default:
      return state
  }
}

export const FilterContext = createContext(null)

export function FilterProvider({ children }) {
  const [state, dispatch] = useReducer(filterReducer, initialState)

  const value = {
    ...state,
    setFilter: (f) => dispatch({ type: 'SET_FILTER', payload: f }),
    setMonth: (m) => dispatch({ type: 'SET_MONTH', payload: m }),
    setQuarter: (q) => dispatch({ type: 'SET_QUARTER', payload: q }),
    setYear: (y) => dispatch({ type: 'SET_YEAR', payload: y }),
    setWeek: (week, year) => dispatch({ type: 'SET_WEEK', payload: { week, year } }),
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}
