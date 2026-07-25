// Escapes characters that are special in a regular expression so user-typed
// search text (e.g. "R&D (Q1)") can be safely dropped into a Mongo $regex
// filter without throwing or being interpreted as regex syntax.
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegex };
