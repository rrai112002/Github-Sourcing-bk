export function calculateYearsExperience(user, repos) {
  if (!repos || repos.length === 0) return null;
  const firstRepoDate = new Date(repos[0].created_at);
  const joinedDate = new Date(user.created_at);
  const earliest = firstRepoDate < joinedDate ? firstRepoDate : joinedDate;
  return new Date().getFullYear() - earliest.getFullYear();
  
}
