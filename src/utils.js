export function escapeAttributeValue(value) {
  // Ultra-minimal escaping purely for attribute values that will be used inside quotes
  // Using `CSS.escape` would create valid but non-minimal strings (escaping things like spaces)
  // whereas this only escapes absolutely necessary characters for attribute values that
  // will be used inside quotes.
  return value
    .replace(/\\/g, '\\\\') // backslash
    .replace(/"/g, '\\"') // quote
    .replace(/\n/g, '\\A ') // newline
    .replace(/\r/g, '\\D ') // carriage return
    .replace(/\f/g, '\\C ') // form feed
}
