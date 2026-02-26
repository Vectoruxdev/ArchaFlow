// Import all action handlers to register them via side effects

// Phase 1: Card Actions
import './move-card'
import './assign-user'
import './assign-random-from-group'
import './unassign-user'
import './set-priority'
import './add-tag'
import './remove-tag'
import './remove-all-tags'
import './set-due-date'
import './clear-due-date'
import './set-custom-field'
import './clear-custom-field'
import './add-automated-comment'
import './copy-card'
import './archive-card'

// Phase 1: Subtask Actions
import './create-subtask'
import './create-subtask-set'
import './complete-all-subtasks'
import './assign-all-subtasks'

// Phase 1: Notification Actions
import './notify-user'
import './notify-card-assignee'
import './notify-card-creator'
import './notify-team'
import './send-email'

// Phase 2: Contract Actions (stubs)
import './generate-contract'
import './send-contract'
import './set-contract-status'

// Phase 2: Invoice Actions (stubs)
import './create-invoice'
import './send-invoice'
import './set-invoice-status'

// Phase 2: AI Actions (stubs)
import './ai-summarize-card'
import './ai-auto-tag'
import './ai-draft-email'
import './ai-classify-card'
