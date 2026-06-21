import { h, icon } from "../../core/utils/dom.js";

// Chip component — used for filters (category/seal/availability) and recipe tags.
//   createChip({ label, iconName, selected, onClick })
export function createChip({
  label,
  iconName = null,
  selected = false,
  onClick,
} = {}) {
  const classes = ["chip"];
  if (selected) classes.push("chip--selected");

  return h(
    "button",
    {
      class: classes.join(" "),
      type: "button",
      "aria-pressed": String(Boolean(selected)),
      onclick: onClick,
    },
    [iconName && icon(iconName, "ti--sm"), label]
  );
}
