import React from "react";

export const ORACLE_LOGO_LABEL = "Oracle logo";

export default function OracleLogo({ className = "oracle-logo" }) {
  return React.createElement(
    "svg",
    {
      className,
      viewBox: "0 0 204 40",
      role: "img",
      "aria-label": ORACLE_LOGO_LABEL,
      focusable: "false",
    },
    React.createElement("rect", {
      x: 2,
      y: 2,
      width: 200,
      height: 36,
      rx: 18,
      fill: "#fff8f1",
      stroke: "currentColor",
      strokeWidth: 3,
    }),
    React.createElement(
      "text",
      {
        x: "50%",
        y: "54%",
        textAnchor: "middle",
        dominantBaseline: "middle",
        fontFamily: "Space Grotesk, Avenir Next, sans-serif",
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: 4,
        fill: "currentColor",
      },
      "ORACLE"
    )
  );
}
