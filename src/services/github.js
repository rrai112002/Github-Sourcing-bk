// import { Octokit } from "octokit";
// import { parsePlainText } from "./gemini.js";
// import { calculateYearsExperience } from "../utils/experience.js";

// const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// // --- Search users with pagination ---
// // async function searchUsers(query, maxUsers = 50) {
// //   let page = 1;
// //   let results = [];
// //   while (results.length < maxUsers) {
// //     const { data } = await octokit.request("GET /search/users", {
// //       q: query,
// //       per_page: 30,
// //       page,
// //       headers: { "X-GitHub-Api-Version": "2022-11-28" },
// //     });
// //     if (!data.items || data.items.length === 0) break;
// //     results = results.concat(data.items);
// //     if (results.length >= data.total_count || results.length >= maxUsers) break;
// //     page++;
// //   }
// //   return results.slice(0, maxUsers);
// // }
// async function searchUsers(query, maxUsers = 50) {
//   let page = 1;
//   let results = [];

//   // search users
//   while (results.length < maxUsers) {
//     const { data } = await octokit.request("GET /search/users", {
//       q: query,
//       per_page: 30,
//       page,
//       headers: { "X-GitHub-Api-Version": "2022-11-28" },
//     });

//     if (!data.items || data.items.length === 0) break;

//     results = results.concat(data.items);

//     if (results.length >= data.total_count || results.length >= maxUsers) break;

//     page++;
//   }

//   // trim down to requested max
//   const users = results.slice(0, 200);

//   // fetch full profiles
//   const profiles = await Promise.all(
//     users.map(u =>
//       octokit.request("GET /users/{username}", {
//         username: u.login,
//         headers: { "X-GitHub-Api-Version": "2022-11-28" },
//       }).then(res => res.data)
//     )
//   );

//   return profiles;
// }

// // --- Get details of a single user ---
// async function getUserDetails(username) {
//   const { data: user } = await octokit.request("GET /users/{username}", {
//     username,
//     headers: { "X-GitHub-Api-Version": "2022-11-28" },
//   });
//   const { data: repos } = await octokit.request("GET /users/{username}/repos", {
//     username,
//     per_page: 100,
//     sort: "created",
//     direction: "asc",
//     headers: { "X-GitHub-Api-Version": "2022-11-28" },
//   });

//   const yearsExp = calculateYearsExperience(user, repos);

//   let topPercent = "Long tail";
//   if (user.followers > 1000) topPercent = "Top 1%";
//   else if (user.followers > 500) topPercent = "Top 5%";
//   else if (user.followers > 100) topPercent = "Top 10%";

//   let linkedin = null;
//   if (user.blog && user.blog.includes("linkedin.com")) linkedin = user.blog;
//   if (!linkedin && user.bio && user.bio.includes("linkedin.com")) {
//     const match = user.bio.match(/https?:\/\/(www\.)?linkedin\.com\/[^\s]+/);
//     if (match) linkedin = match[0];
//   }

//   const languageCounts = {};
//   for (const r of repos) {
//     if (r.language) {
//       languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
//     }
//   }
//   const languagesUsed = Object.keys(languageCounts);
//   const mostUsedLanguage =
//     languagesUsed.length > 0
//       ? Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0][0]
//       : null;

//   return {
//     login: user.login,
//     name: user.name,
//     location: user.location,
//     bio: user.bio,
//     followers: user.followers,
//     public_repos: user.public_repos,
//     years_experience: yearsExp,
//     top_percentage: topPercent,
//     linkedin,
//     twitter: user.twitter_username,
//     avatar: user.avatar_url,
//     profile_url: user.html_url,
//     languages_used: languagesUsed,
//     most_used_language: mostUsedLanguage,
//   };
// }

// // --- Structured search ---
// export async function searchStructured(query, minExp, maxExp, limit = 20) {
//   const users = await searchUsers(query, limit);
//   const results = [];
//   for (const u of users) {
//     const details = await getUserDetails(u.login);
//     if (
//       (!minExp || details.years_experience >= minExp) &&
//       (!maxExp || details.years_experience <= maxExp)
//     ) {
//       results.push(details);
//     }
//   }
//   return results;
// }

// // --- Plain text search ---
// export async function searchPlain(text) {
//   const parsed = await parsePlainText(text);
//   const { query, min_experience, max_experience } = parsed;
//   return await searchStructured(query, min_experience, max_experience, 20);
// }


// import { Octokit } from "octokit";
// import { parsePlainText } from "./gemini.js";
// // import { calculateYearsExperience } from "../utils/experience.js"; // no longer used

// // const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// --- Search users with pagination ---
import { Octokit } from "octokit";
import { parsePlainText } from "./gemini.js";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });


// Helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function withRateLimitRetry(fn, { tries = 3, baseDelayMs = 1500 } = {}) {
  let attempt = 0;
  // simple retry on 403/429 or secondary rate limit
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status;
      const msg = (err?.message || "").toLowerCase();
      if (
        attempt + 1 < tries &&
        (status === 403 || status === 429 || msg.includes("secondary rate limit"))
      ) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
        attempt++;
        continue;
      }
      throw err;
    }
  }
}

async function fetchUserDetails(username) {
  const { data: user } = await withRateLimitRetry(() =>
    octokit.request("GET /users/{username}", {
      username,
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    })
  );

  // Grab up to first 100 repos (good balance of info vs calls)
  const { data: repos } = await withRateLimitRetry(() =>
    octokit.request("GET /users/{username}/repos", {
      username,
      per_page: 100,
      sort: "created",
      direction: "asc",
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    })
  );

  // Experience: (current UTC year - created_at UTC year) + 2, min 0
  const createdYear = new Date(user.created_at).getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();
  const yearsExp = Math.max(0, (currentYear - createdYear) + 2);

  let topPercent = "Below 50%";
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

// --- Search users with pagination (returns *summaries*) ---
// Keep the same function name as you asked.
// Ask for as many as you want via maxUsers (defaults to 1000, GitHub cap).
async function searchUsers(query, maxUsers = 1000) {
  const per_page = 100; // fewer round-trips
  const HARD_CAP = 1000; // GitHub Search API cap
  const target = Math.min(maxUsers, HARD_CAP);

  let page = 1;
  let results = [];
  while (results.length < target) {
    const { data } = await withRateLimitRetry(() =>
      octokit.request("GET /search/users", {
        q: query,
        per_page,
        page,
        headers: { "X-GitHub-Api-Version": "2022-11-28" },
      })
    );

    const items = (data.items || []).filter((u) => u.type === "User");
    if (items.length === 0) break;

    results = results.concat(items);

    // stop if we’ve hit the API’s effective limit or your target
    if (
      results.length >= target ||
      results.length >= Math.min(data.total_count || target, HARD_CAP)
    ) {
      break;
    }
    page++;
  }
  return results.slice(0, target);
}

// Fetch profiles with limited concurrency
async function fetchProfiles(logins, concurrency = 8) {
  const out = [];
  let i = 0;

  async function worker() {
    while (i < logins.length) {
      const idx = i++;
      const login = logins[idx];
      try {
        const d = await fetchUserDetails(login);
        out.push(d);
      } catch (e) {
        // skip problematic users, keep going
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, logins.length) }, worker));
  return out;
}

// --- Structured search ---
// Guarantees at least 50 profiles by default (increase `limit` to get more).
export async function searchStructured(query, minExp, maxExp, limit = 50) {
  console.log("Search structured:", { query, minExp, maxExp, limit });
  const desired = Math.max(50, limit); // ensure minimum 50
  // Over-fetch search results to survive filtering (3x is a good heuristic)
  const candidateSummaries = await searchUsers(query, Math.min(1000, desired * 3));

  const logins = [...new Set(candidateSummaries.map((u) => u.login))];

  const details = await fetchProfiles(logins, 8);

  const filtered = details.filter((d) => {
    const geMin = !minExp || d.years_experience >= minExp;
    const leMax = !maxExp || d.years_experience <= maxExp;
    return geMin && leMax;
  });

  return filtered.slice(0, desired);
}

// --- Plain text search ---
export async function searchPlain(text) {
  const parsed = await parsePlainText(text);
  const { query, min_experience, max_experience, limit } = parsed;
  // if your parser doesn’t supply limit, we’ll still return at least 50
  return await searchStructured(query, min_experience, max_experience, limit ?? 50);
}



