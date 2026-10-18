export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function getPagination(query, defaultLimit = 10, maxLimit = 50) {
  const page = Math.max(parseInt(query.page) || 1, 1)
  const limit = Math.min(Math.max(parseInt(query.limit) || defaultLimit, 1), maxLimit)
  return { page, limit, skip: (page - 1) * limit }
}