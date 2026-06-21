import { h, icon } from "../../../core/utils/dom.js";
import { VALID_ROLES } from "../domain/role.js";
import { ROLE_LABELS } from "./role-labels.js";

// Two-card role chooser shared by registration and onboarding.
//   createRolePicker({ selected, onSelect })
export function createRolePicker({ selected, onSelect }) {
  return h(
    "div",
    { class: "role-grid" },
    VALID_ROLES.map((rol) => {
      const info = ROLE_LABELS[rol];
      return h(
        "button",
        {
          class: `role-card ${selected === rol ? "is-selected" : ""}`,
          type: "button",
          "aria-pressed": String(selected === rol),
          onclick: () => onSelect(rol),
        },
        [
          icon(info.iconName, "role-card__icon"),
          h("span", { class: "role-card__title", text: info.title }),
          h("span", { class: "role-card__desc", text: info.desc }),
        ]
      );
    })
  );
}
