import { useState } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("token") ? true : false
  );

  return (
    <>
      <div className="App">
        {isLoggedIn ? (
          <Dashboard onLogout={() => setIsLoggedIn(false)} />
        ) : (
          <LoginPage onLogin={() => setIsLoggedIn(true)} />
        )}
      </div>
    </>
  );
}

export default App;
