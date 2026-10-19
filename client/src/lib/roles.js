// Where a signed-in user lands when there is nowhere specific to send them.
export const homeFor = (user) =>
  user && ['manager', 'admin'].includes(user.role) ? '/dashboard' : '/services'