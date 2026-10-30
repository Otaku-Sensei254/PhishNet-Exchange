import React from "react";
import ReactDOM from "react-dom/client";
import { UserProvider } from "./context/userContext";
import "./index.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SubmitPage from "./pages/Submit";
import BrowseIOCs from "./pages/BrowseIOCs";
import MagicLogin from "./pages/MagicLogin";

import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import PixelBlast from "./Components/PixelBlast";

import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import TeamDashboard from "./Components/Dashboard/TeamDashboard";
import DashboardWithTeamCheck from "./Components/Dashboard/DashboardWithTeamCheck";
import InvitePage from "./pages/InvitePage";

const Layout = () => {
  return (
    <div className="layout-root">
      <div className="layout-bg">
        <PixelBlast
          variant="square"
          pixelSize={6}
          color="#ef4444"
          patternScale={2}
          patternDensity={0.8}
          pixelSizeJitter={0.3}
          enableRipples
          rippleSpeed={0.3}
          rippleThickness={0.08}
          rippleIntensityScale={1.2}
          liquid={false}
          speed={0.4}
          edgeFade={0.3}
          transparent
        />
      </div>
      <div className="layout-content">
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/submit-threat", element: <SubmitPage /> },
      { path: "/browse-iocs", element: <BrowseIOCs /> },
      { path: "/magic", element: <MagicLogin /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/dashboard", element: <DashboardWithTeamCheck /> },
      { path: "/team", element: <TeamDashboard /> },
    ],
  },
  {
    path: "/payment-success",
    element: <PaymentSuccess />,
  },
  {
    path: "/payment-failed",
    element: <PaymentFailed />,
  },
  {
    path: "/invite",
    element: <InvitePage />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>
);
