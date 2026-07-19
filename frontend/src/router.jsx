import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import App from './App.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'history', element: <HistoryPage /> },
          { path: 'statistics', element: <StatisticsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

export default router;
