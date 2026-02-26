import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'assign_random_from_group',
  label: 'Assign random user from team',
  description: 'Randomly assigns a team member to the card',
  category: 'card',
  icon: 'Users',
  configSchema: {
    fields: [
      {
        key: 'teamId',
        label: 'Team',
        type: 'team_picker',
        required: false,
        placeholder: 'All workspace members',
        helpText: 'Leave blank to pick from all workspace members',
      },
    ],
  },
  async execute(config, context) {
    const admin = getSupabaseAdmin()

    // Fetch workspace members
    const { data: members, error: fetchError } = await admin
      .from('user_roles')
      .select('user_id')
      .eq('business_id', context.board.workspaceId)

    if (fetchError || !members || members.length === 0) {
      return { success: false, error: 'No team members found' }
    }

    // Pick a random member
    const randomIndex = Math.floor(Math.random() * members.length)
    const userId = members[randomIndex].user_id

    // Assign to card
    const { error } = await admin
      .from('project_assignments')
      .upsert(
        { project_id: context.card.id, user_id: userId },
        { onConflict: 'project_id,user_id' }
      )

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { assignedUserId: userId } }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'assign a random team member'
  },
}

actionRegistry.register(handler)
export default handler
