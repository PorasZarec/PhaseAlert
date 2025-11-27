import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";



import ResidentDashboard from "./pages/ResidentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ADMIN ROUTES (Only 'admin' can enter) */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* Add more admin pages here later, e.g., /admin/users */}
      </Route>

      {/* RESIDENT ROUTES (Only 'resident' can enter) */}
      <Route element={<ProtectedRoute allowedRoles={["resident"]} />}>
        <Route path="/resident/dashboard" element={<ResidentDashboard />} />
      </Route>

      {/* Catch all 404 */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;
