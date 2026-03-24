import { useContext } from 'react'
import { FilterContext } from '../context/FilterContext'

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
