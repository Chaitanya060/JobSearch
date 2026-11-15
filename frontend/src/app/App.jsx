import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './ThemeProvider.jsx'
import { AuthProvider } from '../features/auth/AuthContext.jsx'
import { ToastProvider } from '../components/feedback/ToastProvider.jsx'
import { ConfirmProvider } from '../components/feedback/ConfirmProvider.jsx'
import { DevBanner } from '../components/feedback/DevBanner.jsx'
import { router } from './router.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
            <DevBanner />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
