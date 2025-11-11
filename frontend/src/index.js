import React from "react";
import ReactDOM from "react-dom/client";
import { UserProvider } from "./context/userContext"; // ✅ Make sure path is correct
import "./index.css";

import Home from "./pages/Home";
//import Submit from "./pages/Submit";
import Browse from "./pages/Browse";
import Community from "./pages/Community";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Suggestions from "./pages/Suggestions";
import Pricing from "./pages/Pricing";

import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";

import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Dashboard from "./Components/Dashboard/Dashboard";
import Discussions from "./pages/Discussions";
import IOC from "./pages/IOCs";
import SubmitPage from "./pages/Submit";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Post from "./pages/Post";
import TeamDashboard from "./Components/Dashboard/TeamDashboard";

// Layout component with Navbar and Footer
const Layout = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
};

// Define routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/submit-ioc", element: <IOC/> },
      { path: "/browse-iocs", element: <Browse /> },
      { path: "/community", element: <Community /> },
      { path: "/submit-threat", element: <SubmitPage /> },
      { path: "/discussions", element: <Discussions /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/suggest", element: <Suggestions /> },
      { path: "/pricing", element: <Pricing /> },
      { path: "/posts", element: <Post /> },
      { path: "/team", element: <TeamDashboard /> },

    ],
    
  },
  {
    path:"/payment-success",
    element:<PaymentSuccess/>
  },
  {
    path:"/payment-failed",
    element:<PaymentFailed/>
  }
]);

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <UserProvider>
      {" "}
      {/* ✅ Wrap the entire app here */}
      <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>
);
