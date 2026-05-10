import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear stale SW api-cache on load (one-time cleanup for v2 migration)
if ("caches" in window) {
  caches.delete("api-cache").catch(() => {});
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    let reloadingForUpdate = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadingForUpdate) return;
      reloadingForUpdate = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
              if (newWorker.state === "activated") {
                window.dispatchEvent(new CustomEvent("app-update-ready"));
              }
            });
          }
        });

        if (registration.waiting && navigator.serviceWorker.controller) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      })
      .catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
