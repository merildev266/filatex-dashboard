import { createContext, useContext, useState, useCallback } from 'react'

const PageTitleContext = createContext(null)

export function PageTitleProvider({ children }) {
  const [pageTitle, setPageTitle] = useState(null)
  const clearTitle = useCallback(() => setPageTitle(null), [])
  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle, clearTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  return useContext(PageTitleContext) || { pageTitle: null, setPageTitle: () => {}, clearTitle: () => {} }
}
