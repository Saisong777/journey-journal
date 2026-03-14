import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear stale SW api-cache on load (one-time cleanup for v2 migration)
if ("caches" in window) {
  caches.delete("api-cache").catch(() => {});
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
