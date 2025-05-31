import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, AppBar, Toolbar, Tabs, Tab, Box } from '@mui/material';
import { Settings } from './pages/Settings';
import Dashboard from './pages/Dashboard';
import React from 'react';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const pages = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Sprint Reports', path: '/reports' },
  { label: 'Projects Overview', path: '/projects' },
  { label: 'Estimates', path: '/estimates' },
  { label: 'History', path: '/history' },
  { label: 'Settings', path: '/settings' },
];

function Header() {
  const location = useLocation();
  const currentTab = pages.findIndex((p) => location.pathname.startsWith(p.path));
  return (
    <AppBar position="fixed" color="default" elevation={1}>
      <Toolbar>
        <Tabs value={currentTab === -1 ? false : currentTab} textColor="primary" indicatorColor="primary">
          {pages.map((page) => (
            <Tab
              key={page.path}
              label={page.label}
              component={RouterLink}
              to={page.path}
            />
          ))}
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}

// Заглушки для остальных страниц
const Stub: React.FC<{ title: string }> = ({ title }) => (
  <Box sx={{ p: 3, mt: 10 }}>
    <h2>{title}</h2>
    <p>Страница в разработке</p>
  </Box>
);

function App() {
  // Получаем базовый путь из Vite
  const basename = import.meta.env.BASE_URL;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={basename}>
        <Header />
        <Routes>
          <Route path="/dashboard" element={<Box sx={{ mt: 10 }}><Dashboard /></Box>} />
          <Route path="/reports" element={<Stub title="Sprint Reports" />} />
          <Route path="/projects" element={<Stub title="Projects Overview" />} />
          <Route path="/estimates" element={<Stub title="Estimates" />} />
          <Route path="/history" element={<Stub title="History & Trends" />} />
          <Route path="/settings" element={<Box sx={{ mt: 10 }}><Settings /></Box>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
