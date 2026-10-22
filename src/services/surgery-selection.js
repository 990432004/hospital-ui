// Shared by the UI guard and its tests: filtering must never leave a hidden
// previously selected surgery attached to an unrelated query.
export function selectionMatchesSearch(selected,search) {
  return Boolean(selected && selected.title.toLowerCase().includes(String(search||'').trim().toLowerCase()))
}
