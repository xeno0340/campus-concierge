const isStaff = (user) => !!user && ['manager', 'admin'].includes(user.role)

// pages that only make sense for students and faculty
const STUDENT_ONLY = ['/bookings']

export const homeFor = (user) => (isStaff(user) ? '/dashboard' : '/services')

// Where to send someone right after login: the page they came from, unless
// that page isn't meant for their role.
export function landingFor(user, from) {
  if (from && !(isStaff(user) && STUDENT_ONLY.includes(from))) return from
  return homeFor(user)
}