import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { RootLayout } from '@/components/layout/root-layout'
import { HomePage } from '@/pages/home'
import { EntryPage } from '@/pages/entry'
import '@/styles/index.css'
import '@/styles/app.css'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/:entryId', element: <EntryPage /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
)
