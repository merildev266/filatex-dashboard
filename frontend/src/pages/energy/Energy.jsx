import SectionLayout from '../../components/SectionLayout'
import { useFilters } from '../../hooks/useFilters'
import FilterBar from '../../components/FilterBar'

export default function Energy() {
  const { currentFilter, setFilter } = useFilters()

  return (
    <SectionLayout
      name="Energy"
      color="#00ab63"
      basePath="/energy"
      headerRight={<FilterBar current={currentFilter} onChange={setFilter} />}
    />
  )
}
