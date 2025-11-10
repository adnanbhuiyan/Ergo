/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import type { AuthContextType } from "./contexts/AuthContext";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
    context: {
      auth: AuthContextType;
    };
  }
}

function App() {
  const auth = useAuth();
  const router = createRouter({
    routeTree,
    context: {
      auth: auth as AuthContextType,
    },
  });

  return <RouterProvider router={router} />;
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  );
}
