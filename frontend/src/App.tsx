import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Flashcards from './pages/Flashcards';
import Stats from './pages/Stats'; // Keeping the name but acts as Dashboard

function App() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <header className="container nav-bar fade-in">
        <Link to="/" className="nav-brand">YDS Flashcards</Link>
        <nav className="nav-links">
          {token ? (
            <button onClick={handleLogout} className="btn btn-danger">Logout</button>
          ) : (
            <>
              <Link to="/login" className="btn" style={{ background: 'transparent', boxShadow: 'none' }}>Login</Link>
              <Link to="/register" className="btn">Register</Link>
            </>
          )}
        </nav>
      </header>
      
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Stats />} />
          <Route path="/study" element={<Flashcards />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
