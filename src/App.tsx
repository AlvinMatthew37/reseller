import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/AppShell'
import { SchedulePage } from './pages/SchedulePage'
import { VendorDetailPage } from './pages/VendorDetailPage'
import { VendorsPage } from './pages/VendorsPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<SchedulePage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/vendors/:vendorId" element={<VendorDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
