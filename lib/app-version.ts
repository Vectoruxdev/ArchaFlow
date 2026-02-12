export const APP_VERSION = "V0.00.01"

export interface ChangelogEntry {
  version: string
  date: string // e.g. "2026-02-11"
  changes: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "V0.00.01",
    date: "2026-02-11",
    changes: [
      "Initial version display",
      "Searchable city and state dropdowns",
      "Leads pricing layout improvements",
    ],
  },
]
