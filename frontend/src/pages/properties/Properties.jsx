import SectionLayout from '../../components/SectionLayout'

export default function Properties() {
  return (
    <SectionLayout
      name="Properties"
      color="#FDB823"
      basePath="/properties"
      pageNames={{
        'foncier': 'Foncier',
        'dev': 'Développement',
        'tvx': 'Travaux',
        'com': 'Commercialisation',
        'recouvrement': 'Recouvrement',
        'sav': 'SAV',
      }}
    />
  )
}
