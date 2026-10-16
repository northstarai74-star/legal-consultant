import { Link, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { ToastProvider } from './context/ToastContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { DocsProvider } from './context/DocsContext.jsx';
import Layout from './components/Layout.jsx';
import { EmptyState } from './components/ui.jsx';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Templates from './pages/Templates.jsx';
import NewDocument from './pages/NewDocument.jsx';
import Editor from './pages/Editor.jsx';
import Library from './pages/Library.jsx';
import SettingsPage from './pages/Settings.jsx';
import SupportPage from './pages/Support.jsx';

function NotFound() {
  return (
    <div className="page">
      <EmptyState
        icon={Compass}
        title="Page not found"
        action={
          <Link to="/app" className="btn btn--primary">
            Back to home
          </Link>
        }
      >
        The page you’re looking for doesn’t exist.
      </EmptyState>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <DocsProvider>
          <Routes>
            <Route index element={<Landing />} />
            <Route element={<Layout />}>
              <Route path="app" element={<Dashboard />} />
              <Route path="new" element={<Templates />} />
              <Route path="new/:templateId" element={<NewDocument />} />
              <Route path="documents" element={<Library />} />
              <Route path="doc/:id" element={<Editor />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </DocsProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
