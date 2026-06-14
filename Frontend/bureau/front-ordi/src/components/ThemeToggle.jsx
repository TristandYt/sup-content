import React from "react";
import "./ThemeToggle.css";

const ThemeToggle = ({ theme, toggleTheme }) => {
  // Interface de switch simple pour alterner entre le mode clair et le mode sombre
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={theme === "light"}
        onChange={toggleTheme}
      />
      <span className="slider"></span>
    </label>
  );
};

export default ThemeToggle;
