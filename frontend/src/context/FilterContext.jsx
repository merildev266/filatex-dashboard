import { createContext, useReducer } from 'react'

const now = new Date()

const initialState = {
  currentFilter: 'M',  // Matches existing JS: 'J-1' | 'M' | 'Q' | 'A'
  selectedMonthIndex: now.getMonth(),
  selectedQuarter: Math.floor(now.getMonth() / 3) + 1,
  selectedYear: now.getFullYear(),
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
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}
