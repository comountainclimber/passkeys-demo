import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";
import { useAuthStore } from "./state/authentication";
import { useEffect } from "react";
import { Authenticated } from "./components/Authenticated";
import { Home } from "./components/Home";
import { Loading } from "./components/Loading";

function ExternalRoutes() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function PrivateRoutes() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Authenticated />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  const authenticated = useAuthStore((state) => state.authenticated);
  const authLoading = useAuthStore((state) => state.loading);
  const loading = authLoading;
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!loading) {
    return authenticated ? <PrivateRoutes /> : <ExternalRoutes />;
  }
}

export default App;
