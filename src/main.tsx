import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import LanguageController from "./language";
import "./style.css";
import "./language.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <>
      <App />
      <LanguageController />
    </>
  </StrictMode>,
);
