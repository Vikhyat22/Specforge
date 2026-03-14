import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import NewProject from './pages/NewProject'
import SpecGen from './pages/SpecGen'
import CodeGen from './pages/CodeGen'
import PreviewPage from './pages/PreviewPage'

export default function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:id" element={<SpecGen />} />
          <Route path="/projects/:id/code" element={<CodeGen />} />
          <Route path="/projects/:id/preview" element={<PreviewPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  )
}
