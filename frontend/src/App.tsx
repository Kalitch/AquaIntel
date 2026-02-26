import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './config/theme';
import { Layout } from './components/shared/Layout';
import { StationProvider } from './hooks/useStation';
import { DashboardPage } from './pages/DashboardPage';
import { HistoricalPage } from './pages/HistoricalPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { PlatformHistoryPage } from './pages/PlatformHistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AboutPage } from './pages/AboutPage';
import { LegislationPage } from './pages/LegislationPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <StationProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/historical" element={<HistoricalPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
            <Route path="/history" element={<PlatformHistoryPage />} />
            <Route path="/legislation" element={<LegislationPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Layout>
        </StationProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
