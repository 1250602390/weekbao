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

/**
 * 页面关闭前通过 fetch + keepalive 确保草稿保存请求发出
 * @param {string} url - API 地址
 * @param {object} body - 请求体
 * @param {string} token - 认证 token
 */
export function sendBeaconSave(url, body, token) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
  // fetch + keepalive 确保即使页面关闭请求也能发出
  fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
    keepalive: true
  })
}

export function saveBeforeUnload(callback) {
  window.addEventListener('beforeunload', callback)
  return () => window.removeEventListener('beforeunload', callback)
}
