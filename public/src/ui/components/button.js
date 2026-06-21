import { h, icon } from "../../core/utils/dom.js";

// Button component.
//   createButton({ label, variant, iconName, block, onClick, type })
// variant: "primary" | "accent" | "whatsapp" | "ghost"
export function createButton({
  label,
  variant = "primary",
  iconName = null,
  block = false,
  size = "md",
  onClick,
  type = "button",
} = {}) {
  const classes = ["btn", `btn--${variant}`];
  if (block) classes.push("btn--block");
  if (size === "sm") classes.push("btn--sm");

  return h(
    "button",
    { class: classes.join(" "), type, onclick: onClick },
    [iconName && icon(iconName), label]
  );
}
