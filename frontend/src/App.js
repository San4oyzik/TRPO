// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ToastProvider from "./components/ToastProvider";
import BookingForm from "./pages/BookingPage";
import PrivateRoute from "./privateRoute";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/Dashboard";
import EmployeeSchedule from "./pages/EmployeeSchedule";
import AllAppointments from "./pages/AllAppointments";
import FinanceReport from "./pages/FinanceReport";
import ClientList from "./pages/ClientList";
import ServiceManager from "./pages/ServiceManager";
import UserAppointments from "./pages/UserAppointments";
import AuthForm from "./components/AuthForm";
import "./styles/toast.css";

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthForm />} />
          <Route
            path="/booking"
            element={
              <PrivateRoute>
                <BookingForm />
              </PrivateRoute>
            }
          />
          <Route path="/appointments" element={<UserAppointments />} />
          <Route
            path="/employee-calendar"
            element={
              <PrivateRoute>
                <EmployeeDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          >
            <Route path="schedule" element={<EmployeeSchedule />} />
            <Route path="appointments" element={<AllAppointments />} />
            <Route path="finance" element={<FinanceReport />} />
            <Route path="clients" element={<ClientList />} />
            <Route path="services" element={<ServiceManager />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}
