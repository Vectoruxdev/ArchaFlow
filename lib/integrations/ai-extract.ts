import type { NormalizedMessage, ExtractedTask } from "./types"

// Keyword patterns that indicate actionable tasks
const TASK_PATTERNS = [
  { pattern: /\bneed(?:s)?\s+to\b/i, priority: "medium" as const, confidence: 0.85 },
  { pattern: /\bshould\s+(?:we\s+)?/i, priority: "medium" as const, confidence: 0.7 },
  { pattern: /\bplease\s+/i, priority: "medium" as const, confidence: 0.8 },
  { pattern: /\bcan\s+you\s+/i, priority: "medium" as const, confidence: 0.75 },
  { pattern: /\bcould\s+you\s+/i, priority: "medium" as const, confidence: 0.7 },
  { pattern: /\bmake\s+sure\s+/i, priority: "high" as const, confidence: 0.85 },
  { pattern: /\bdon'?t\s+forget\s+/i, priority: "high" as const, confidence: 0.9 },
  { pattern: /\bremind(?:er)?\b/i, priority: "medium" as const, confidence: 0.75 },
  { pattern: /\btodo\b|\bto-do\b|\bto do\b/i, priority: "medium" as const, confidence: 0.9 },
  { pattern: /\baction\s+item\b/i, priority: "high" as const, confidence: 0.95 },
  { pattern: /\bfollow\s+up\b/i, priority: "medium" as const, confidence: 0.85 },
  { pattern: /\bdeadline\b/i, priority: "high" as const, confidence: 0.85 },
  { pattern: /\basap\b/i, priority: "urgent" as const, confidence: 0.9 },
  { pattern: /\burgent(?:ly)?\b/i, priority: "urgent" as const, confidence: 0.9 },
  { pattern: /\bfix\s+/i, priority: "high" as const, confidence: 0.8 },
  { pattern: /\bupdate\s+/i, priority: "medium" as const, confidence: 0.7 },
  { pattern: /\bschedule\s+/i, priority: "medium" as const, confidence: 0.8 },
  { pattern: /\bset\s+up\b/i, priority: "medium" as const, confidence: 0.75 },
  { pattern: /\bcreate\s+/i, priority: "medium" as const, confidence: 0.7 },
  { pattern: /\bsend\s+/i, priority: "medium" as const, confidence: 0.7 },
  { pattern: /\breview\s+/i, priority: "medium" as const, confidence: 0.75 },
  { pattern: /\bapprove\s+/i, priority: "high" as const, confidence: 0.8 },
  { pattern: /\bfinish\s+/i, priority: "high" as const, confidence: 0.85 },
  { pattern: /\bcomplete\s+/i, priority: "high" as const, confidence: 0.8 },
  { pattern: /\bsubmit\s+/i, priority: "high" as const, confidence: 0.8 },
  { pattern: /\bby\s+(?:end\s+of\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|eod|eow)\b/i, priority: "high" as const, confidence: 0.85 },
]

// Patterns to skip (not tasks)
const SKIP_PATTERNS = [
  /^(?:hi|hey|hello|morning|afternoon|thanks|thank you|lol|haha|ok|okay|sure|yeah|yep|np|no problem|sounds good|great|nice|cool|👍)/i,
  /^(?:good morning|good afternoon|good evening|have a good|see you|bye|ttyl)/i,
  /^\?+$/, // Just question marks
]

// Date extraction patterns
const DATE_PATTERNS = [
  { pattern: /\btomorrow\b/i, getDays: () => 1 },
  { pattern: /\btonight\b/i, getDays: () => 0 },
  { pattern: /\bnext\s+week\b/i, getDays: () => 7 },
  { pattern: /\bend\s+of\s+(?:the\s+)?week\b|\beow\b/i, getDays: () => { const d = new Date(); return 5 - d.getDay(); } },
  { pattern: /\bend\s+of\s+(?:the\s+)?day\b|\beod\b/i, getDays: () => 0 },
  { pattern: /\bmonday\b/i, getDays: () => daysUntil(1) },
  { pattern: /\btuesday\b/i, getDays: () => daysUntil(2) },
  { pattern: /\bwednesday\b/i, getDays: () => daysUntil(3) },
  { pattern: /\bthursday\b/i, getDays: () => daysUntil(4) },
  { pattern: /\bfriday\b/i, getDays: () => daysUntil(5) },
]

function daysUntil(targetDay: number): number {
  const today = new Date().getDay()
  const diff = targetDay - today
  return diff <= 0 ? diff + 7 : diff
}

function extractDueDate(content: string): string | null {
  for (const { pattern, getDays } of DATE_PATTERNS) {
    if (pattern.test(content)) {
      const date = new Date()
      date.setDate(date.getDate() + getDays())
      return date.toISOString().split("T")[0]
    }
  }
  return null
}

function generateTitle(content: string): string {
  // Clean up the message content into a task title
  let title = content
    .replace(/<@[^>]+>/g, "") // Remove user mentions
    .replace(/<#[^>]+>/g, "") // Remove channel mentions
    .replace(/https?:\/\/\S+/g, "") // Remove URLs
    .replace(/:[a-z_]+:/g, "") // Remove emoji codes
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  // Truncate to reasonable length
  if (title.length > 80) {
    title = title.slice(0, 77) + "..."
  }

  return title || "Untitled task"
}

export async function extractTasksFromMessages(
  messages: NormalizedMessage[]
): Promise<ExtractedTask[]> {
  if (messages.length === 0) return []

  const tasks: ExtractedTask[] = []

  for (const message of messages) {
    const content = message.content.trim()

    // Skip very short messages or greetings
    if (content.length < 10) continue
    if (SKIP_PATTERNS.some((p) => p.test(content))) continue

    // Check each task pattern
    let bestMatch: { priority: ExtractedTask["priority"]; confidence: number } | null = null

    for (const { pattern, priority, confidence } of TASK_PATTERNS) {
      if (pattern.test(content)) {
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { priority, confidence }
        }
      }
    }

    if (bestMatch) {
      tasks.push({
        id: crypto.randomUUID(),
        title: generateTitle(content),
        description: `From #${message.channelName} by ${message.author}`,
        priority: bestMatch.priority,
        dueDate: extractDueDate(content),
        confidence: bestMatch.confidence,
        selected: bestMatch.confidence >= 0.7,
        sourceMessage: message,
      })
    }
  }

  // Sort by confidence descending
  tasks.sort((a, b) => b.confidence - a.confidence)

  return tasks
}
