import { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { Layout } from './components/layout/Layout'

import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ExpensesPage } from './pages/expenses/ExpensesPage'
import { BudgetPage } from './pages/budget/BudgetPage'
import { AdminPage } from './pages/admin/AdminPage'

export default class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><Layout><ExpensesPage /></Layout></ProtectedRoute>} />
              <Route path="/budget" element={<ProtectedRoute><Layout><BudgetPage /></Layout></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><Layout><AdminPage /></Layout></AdminRoute>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </Provider>
    )
  }
}
