import SectionLayout from '../../components/SectionLayout'

export default function Reporting() {
  return (
    <SectionLayout
      name="Reporting"
      color="#426ab3"
      basePath="/reporting"
      pageNames={{
        'enr': 'Reporting EnR',
        'hfo': 'Reporting HFO',
        'lfo': 'Reporting LFO',
        'properties': 'Reporting Properties',
        'investments': 'Reporting Investments',
      }}
    />
  )
}
