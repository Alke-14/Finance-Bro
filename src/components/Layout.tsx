import React from "react";
import { Link, Outlet } from "react-router-dom";
import Nav from "./Nav";

const Layout: React.FC = () => {
  return (
    <div>
      <header>
        <Nav />
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        © {new Date().getFullYear()} CarVibes — Built with React by Julian, Kevin, Lorenzo, and Avery
      </footer>
    </div>
  );
};

export default Layout;
