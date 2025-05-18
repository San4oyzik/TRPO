import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  // Простейшая валидация токена: есть и не "undefined"
  const isAuth = token && token !== "undefined";

  return isAuth ? children : <Navigate to="/" replace />;
}
