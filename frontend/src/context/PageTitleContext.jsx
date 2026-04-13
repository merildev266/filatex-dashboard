import { createContext, useContext, useState, useCallback } from 'react'

const PageTitleContext = createContext(null)

export function PageTitleProvider({ children }) {
  const [pageTitle, setPageTitle] = useState(null)
  // Custom back button override: { label, onClick }
  const [backOverride, setBackOverride] = useState(null)
  const clearTitle = useCallback(() => { setPageTitle(null); setBackOverride(null) }, [])
  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle, clearTitle, backOverride, setBackOverride }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  return useContext(PageTitleContext) || { pageTitle: null, setPageTitle: () => {}, clearTitle: () => {}, backOverride: null, setBackOverride: () => {} }
}
