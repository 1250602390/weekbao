let draftTimer = null

export function startDraftAutoSave(callback, interval = 30000) {
  stopDraftAutoSave()
  draftTimer = setInterval(callback, interval)
}

export function stopDraftAutoSave() {
  if (draftTimer) {
    clearInterval(draftTimer)
    draftTimer = null
  }
}

export function saveBeforeUnload(callback) {
  window.addEventListener('beforeunload', callback)
  return () => window.removeEventListener('beforeunload', callback)
}
