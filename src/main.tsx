import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import About from "./About";
import Layout from "./components/Layout";
import Results from "./pages/Results";
import Car from "./pages/Car";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path="form" element={<About />} />
          <Route path="results" element={<Results />} />
          <Route path="car/:id" element={<Car />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
