import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Settings } from './pages/Settings';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  // Получаем базовый путь из Vite
  const basename = import.meta.env.BASE_URL;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={basename}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/settings" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
