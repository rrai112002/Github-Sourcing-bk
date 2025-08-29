import { Octokit } from "octokit";
import { parsePlainText } from "./gemini.js";
import { calculateYearsExperience } from "../utils/experience.js";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// --- Search users with pagination ---
async function searchUsers(query, maxUsers = 50) {
  let page = 1;
  let results = [];
  while (results.length < maxUsers) {
    const { data } = await octokit.request("GET /search/users", {
      q: query,
      per_page: 30,
      page,
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    });
    if (!data.items || data.items.length === 0) break;
    results = results.concat(data.items);
    if (results.length >= data.total_count || results.length >= maxUsers) break;
    page++;
  }
  return results.slice(0, maxUsers);
}

// --- Get details of a single user ---
async function getUserDetails(username) {
  const { data: user } = await octokit.request("GET /users/{username}", {
    username,
    headers: { "X-GitHub-Api-Version": "2022-11-28" },
  });
  const { data: repos } = await octokit.request("GET /users/{username}/repos", {
    username,
    per_page: 100,
    sort: "created",
    direction: "asc",
    headers: { "X-GitHub-Api-Version": "2022-11-28" },
  });

  const yearsExp = calculateYearsExperience(user, repos);

  let topPercent = "Long tail";
  if (user.followers > 1000) topPercent = "Top 1%";
  else if (user.followers > 500) topPercent = "Top 5%";
  else if (user.followers > 100) topPercent = "Top 10%";

  let linkedin = null;
  if (user.blog && user.blog.includes("linkedin.com")) linkedin = user.blog;
  if (!linkedin && user.bio && user.bio.includes("linkedin.com")) {
    const match = user.bio.match(/https?:\/\/(www\.)?linkedin\.com\/[^\s]+/);
    if (match) linkedin = match[0];
  }

  const languageCounts = {};
  for (const r of repos) {
    if (r.language) {
      languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
    }
  }
  const languagesUsed = Object.keys(languageCounts);
  const mostUsedLanguage =
    languagesUsed.length > 0
      ? Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  return {
    login: user.login,
    name: user.name,
    location: user.location,
    bio: user.bio,
    followers: user.followers,
    public_repos: user.public_repos,
    years_experience: yearsExp,
    top_percentage: topPercent,
    linkedin,
    twitter: user.twitter_username,
    avatar: user.avatar_url,
    profile_url: user.html_url,
    languages_used: languagesUsed,
    most_used_language: mostUsedLanguage,
  };
}

// --- Structured search ---
export async function searchStructured(query, minExp, maxExp, limit = 20) {
  const users = await searchUsers(query, limit);
  const results = [];
  for (const u of users) {
    const details = await getUserDetails(u.login);
    if (
      (!minExp || details.years_experience >= minExp) &&
      (!maxExp || details.years_experience <= maxExp)
    ) {
      results.push(details);
    }
  }
  return results;
}

// --- Plain text search ---
export async function searchPlain(text) {
  const parsed = await parsePlainText(text);
  const { query, min_experience, max_experience } = parsed;
  return await searchStructured(query, min_experience, max_experience, 20);
}
