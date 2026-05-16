function success(data = null, msg = 'success') {
  return { code: 0, msg, data }
}

function fail(code = -1, msg = 'error', data = null) {
  return { code, msg, data }
}

function paginate(list, total, page, pageSize) {
  return {
    list,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize)
  }
}

module.exports = { success, fail, paginate }
