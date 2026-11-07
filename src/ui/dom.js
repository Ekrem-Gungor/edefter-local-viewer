export const byId = (id) => document.getElementById(id);
export const pretty = (value) => String(value ?? "").trim() || "—";
const formatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const money = (value) => formatter.format(value || 0);
export const date = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value || "")
    ? `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}`
    : pretty(value);
export const period = (start, end) =>
  start && end ? `${date(start)} – ${date(end)}` : date(start || end);
export function addText(parent, tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value ?? "";
  if (className) element.className = className;
  parent.append(element);
  return element;
}
export function setText(id, value) {
  byId(id).textContent = pretty(value);
}
