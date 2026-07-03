#!/usr/bin/env bun

const repo = "cmwang2021/opencode"
const days = 60
const msg = `To stay organized issues are automatically closed after ${days} days of no activity. If the issue is still relevant please open a new one.`

const token = process.env.GITHUB_TOKEN
if (!token) {
  console.error("GITHUB_TOKEN environment variable is required")
  process.exit(1)
}

const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

type Issue = {
  number: number
  updated_at: string
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
}

async function close(num: number) {
  const base = `https://api.github.com/repos/${repo}/issues/${num}`

  const comment = await fetch(`${base}/comments`, {
    method: "POST",
    headers,
    body: JSON.stringify({ body: msg }),
  })
  
  // Skip if 403 (no permission to comment) or 404 (issue not found)
  if (comment.status === 403) {
    console.log(`⚠️  Skipped commenting on #${num} (403 Forbidden - may be from fork or protected)`)
  } else if (comment.status === 404) {
    console.log(`⚠️  Skipped commenting on #${num} (404 Not Found - issue may have been deleted)`)
  } else if (!comment.ok) {
    throw new Error(`Failed to comment #${num}: ${comment.status} ${comment.statusText}`)
  } else {
    console.log(`✓ Commented on #${num}`)
  }

  const patch = await fetch(base, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ state: "closed", state_reason: "not_planned" }),
  })
  
  // If close fails with 404, the issue doesn't exist - skip it
  if (patch.status === 404) {
    console.log(`⚠️  Skipped closing #${num} (404 Not Found)`)
    return
  }
  
  if (!patch.ok) throw new Error(`Failed to close #${num}: ${patch.status} ${patch.statusText}`)

  console.log(`✓ Closed https://github.com/${repo}/issues/${num}`)
}

async function main() {
  let page = 1
  let closed = 0
  let skipped = 0

  while (true) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/issues?state=open&sort=updated&direction=asc&per_page=100&page=${page}&exclude_pull_requests=true`,
      { headers },
    )
    if (!res.ok) throw new Error(res.statusText)

    const all = (await res.json()) as Issue[]
    if (all.length === 0) break
    console.log(`Fetched page ${page} ${all.length} issues`)

    const stale: number[] = []
    for (const i of all) {
      const updated = new Date(i.updated_at)
      if (updated < cutoff) {
        stale.push(i.number)
      } else {
        console.log(`\nFound fresh issue #${i.number}, stopping`)
        if (stale.length > 0) {
          for (const num of stale) {
            try {
              await close(num)
              closed++
            } catch (err) {
              console.error(`Error closing #${num}:`, err)
              skipped++
            }
          }
        }
        console.log(`\n✓ Closed ${closed} issues, ⚠️  Skipped ${skipped} issues`)
        return
      }
    }

    if (stale.length > 0) {
      for (const num of stale) {
        try {
          await close(num)
          closed++
        } catch (err) {
          console.error(`Error closing #${num}:`, err)
          skipped++
        }
      }
    }

    page++
  }

  console.log(`\n✓ Closed ${closed} issues total, ⚠️  Skipped ${skipped} issues`)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
