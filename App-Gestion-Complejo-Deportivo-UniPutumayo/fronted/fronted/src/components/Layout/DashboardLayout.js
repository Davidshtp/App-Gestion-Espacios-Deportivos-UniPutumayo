// src/layouts/DashboardLayout.js
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import { Outlet } from "react-router-dom";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
