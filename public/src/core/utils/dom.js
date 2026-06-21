// Tiny DOM helper — keeps component factories declarative without a framework.
//
//   h("div", { class: "card", onclick: fn }, [child, "text"])
//
// - tag:      HTML tag name.
// - props:    attributes; keys starting with "on" become event listeners,
//             "class" and "text"/"html" are handled specially.
// - children: a node, a string, or an array of either (falsy values skipped).
//
// SECURITY: dynamic/user data must ALWAYS go through "text" (uses textContent,
// XSS-safe). The "html" prop sets innerHTML and is reserved for trusted, static
// markup only — never pass product names, descriptions, or any user input to it.

export function h(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value);
    }
  }

  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }

  return node;
}

// Tabler icon element (matches the <i class="ti ti-*"> markup from the mockups).
export function icon(name, extraClass = "") {
  return h("i", { class: `ti ti-${name} ${extraClass}`.trim() });
}
