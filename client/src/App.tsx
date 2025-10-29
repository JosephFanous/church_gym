import { Link, NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AvailabilityPage from './pages/AvailabilityPage';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-link${isActive ? ' active' : ''}`;

const App = () => {
  return (
    <div className="app-shell">
      <header>
        <nav>
          <strong>
            <Link to="/">Church Gym</Link>
          </strong>
          <NavLink to="/availability" className={navLinkClass}>
            Availability
          </NavLink>
          <NavLink to="/book" className={navLinkClass}>
            Book Now
          </NavLink>
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      <footer>&copy; {new Date().getFullYear()} Church Gym Rentals</footer>
    </div>
  );
};

export default App;
