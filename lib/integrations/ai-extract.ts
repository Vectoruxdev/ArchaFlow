import Anthropic from "@anthropic-ai/sdk"
import type { NormalizedMessage, ExtractedTask } from "./types"

export async function extractTasksFromMessages(
  messages: NormalizedMessage[]
): Promise<ExtractedTask[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY")

  if (messages.length === 0) return []

  const client = new Anthropic({ apiKey })

  // Format messages for the prompt
  const formatted = messages
    .map(
      (m, i) =>
        `[${i + 1}] #${m.channelName} | ${m.author} | ${m.timestamp}\n${m.content}`
    )
    .join("\n\n")

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a task extraction assistant. Analyze the following chat messages and extract actionable tasks, action items, requests, and to-dos.

For each task you find, provide:
- title: A concise task title (imperative form, e.g. "Review Q3 budget report")
- description: Brief context from the conversation
- priority: "low", "medium", "high", or "urgent"
- dueDate: ISO date string if a date/deadline is mentioned, otherwise null
- confidence: A score from 0.0 to 1.0 indicating how confident you are this is a real task
- sourceMessageIndex: The 1-based index of the message this task came from

Only extract genuine tasks — skip casual conversation, greetings, questions without action items, and status updates that don't require action.

Return your response as a JSON array. If no tasks are found, return an empty array [].

Example output:
[
  {
    "title": "Update the landing page copy",
    "description": "Sarah mentioned the landing page copy needs updating before Friday launch",
    "priority": "high",
    "dueDate": null,
    "confidence": 0.9,
    "sourceMessageIndex": 3
  }
]

Messages:
${formatted}

Return ONLY the JSON array, no other text.`,
      },
    ],
  })

  const text =
    response.content[0].type === "text" ? response.content[0].text : ""

  // Parse the JSON response
  let parsed: any[]
  try {
    // Handle potential markdown code blocks in the response
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim()
    parsed = JSON.parse(cleaned)
  } catch {
    console.error("[AI Extract] Failed to parse response:", text)
    return []
  }

  if (!Array.isArray(parsed)) return []

  return parsed.map((task: any) => {
    const sourceIdx = (task.sourceMessageIndex || 1) - 1
    const sourceMessage = messages[sourceIdx] || messages[0]

    return {
      id: crypto.randomUUID(),
      title: task.title || "Untitled task",
      description: task.description || "",
      priority: ["low", "medium", "high", "urgent"].includes(task.priority)
        ? task.priority
        : "medium",
      dueDate: task.dueDate || null,
      confidence: typeof task.confidence === "number" ? task.confidence : 0.5,
      selected: (typeof task.confidence === "number" ? task.confidence : 0.5) >= 0.7,
      sourceMessage,
    }
  })
}
