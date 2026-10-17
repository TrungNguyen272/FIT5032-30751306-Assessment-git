// Helpers for the data tables.

// Turn one cell into lowercase text so searching ignores case.
function cellText(row, column) {
  const value = row[column.key]
  return value === null || value === undefined ? '' : String(value).toLowerCase()
}

// Keep only the rows that match the global search box and every column filter.
export function filterRows(rows, columns, globalQuery, columnFilters) {
  const query = globalQuery.trim().toLowerCase()

  return rows.filter((row) => {
    // At least one column must contain the text.
    if (query && !columns.some((col) => cellText(row, col).includes(query))) {
      return false
    }

    // Every filled-in filter must match.
    return columns.every((col) => {
      const wanted = (columnFilters[col.key] || '').trim().toLowerCase()
      if (!wanted) return true
      // Dropdown filters need an exact match, text filters a partial one.
      return col.filter === 'select'
        ? cellText(row, col) === wanted
        : cellText(row, col).includes(wanted)
    })
  })
}
// Sort rows by one column.
// direction is 'asc', 'desc' or 'off' (off gives the rows back as they came in).
export function sortRows(rows, columns, sortKey, direction) {
  if (!sortKey || direction === 'off') return rows

  const column = columns.find((col) => col.key === sortKey)
  if (!column) return rows

  const factor = direction === 'desc' ? -1 : 1

  // Remember the original position so equal values keep their order.
  const indexed = rows.map((row, index) => ({ row, index }))

  indexed.sort((a, b) => {
    const left = a.row[sortKey]
    const right = b.row[sortKey]
    let result

    if (column.type === 'number') {
      result = Number(left) - Number(right)
    } else if (column.type === 'date') {
      // yyyy-mm-dd strings sort correctly as plain text.
      result = String(left).localeCompare(String(right))
    } else {
      result = String(left).localeCompare(String(right), undefined, { sensitivity: 'base' })
    }

    return result !== 0 ? result * factor : a.index - b.index
  })

  return indexed.map((item) => item.row)
}

// Slice out the rows for one page. Pages start at 1.
export function paginate(rows, page, pageSize) {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

// Page buttons to show,  [1 ... 4, 5, 6, .., 20].
export function pageWindow(current, total, around = 1) {
  const pages = []
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= around) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }
  return pages
}

// Build CSV text for the rows currently shown (header row + one line per row).
export function toCsv(rows, columns) {
  const quote = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return '"' + text.replace(/"/g, '""') + '"'
  }

  const header = columns.map((col) => quote(col.label)).join(',')
  const lines = rows.map((row) => columns.map((col) => quote(row[col.key])).join(','))
  return [header, ...lines].join('\r\n')
}
