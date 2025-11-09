import React from "react";
import { Link, Outlet } from "react-router-dom";

const Layout: React.FC = () => {
  return (
    <div>
      <header>
        <nav>
          <Link to="/">Finance Bro</Link>
          <div>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        © {new Date().getFullYear()} Finance Bro — Built with React
      </footer>
    </div>
  );
};

export default Layout;
