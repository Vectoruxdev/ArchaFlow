-- ============================================================
-- Flow Automation — Recipe Templates Seed Data
-- Run AFTER supabase-flow-automation.sql
-- ============================================================

INSERT INTO flow_recipe_templates (name, description, category, trigger_type, trigger_config, conditions, actions, preview_summary, is_featured, sort_order)
VALUES

-- ============================================================
-- SALES (1-5)
-- ============================================================
(
  'Auto-assign new leads',
  'Automatically assign new leads to a team member using round-robin.',
  'sales',
  'card_created',
  '{}',
  '[]',
  '[{"id":"a1","type":"assign_random_from_group","config":{},"order":0,"continueOnFailure":true}]',
  'When a card is created, assign a random team member',
  true,
  1
),
(
  'Move to Sale when high priority',
  'Automatically advance high-priority leads to the Sale column.',
  'sales',
  'card_priority_changed',
  '{}',
  '[{"id":"c1","field":"priority","operator":"equals","value":"high"}]',
  '[{"id":"a1","type":"move_card","config":{"targetColumnId":"sale"},"order":0,"continueOnFailure":false}]',
  'When priority changes to high, move card to Sale',
  true,
  2
),
(
  'Notify team on new sale',
  'Alert the whole team when a card enters the Sale column.',
  'sales',
  'card_moved_to',
  '{"columnId":"sale"}',
  '[]',
  '[{"id":"a1","type":"notify_team","config":{"message":"New sale: {{card.title}}"},"order":0,"continueOnFailure":true}]',
  'When a card moves to Sale, notify the team',
  false,
  3
),
(
  'Flag stale leads',
  'Set priority to high if a lead stays untouched for 7 days.',
  'sales',
  'card_stuck_in_column',
  '{"columnId":"lead","days":7}',
  '[]',
  '[{"id":"a1","type":"set_priority","config":{"priority":"high"},"order":0,"continueOnFailure":true},{"id":"a2","type":"add_automated_comment","config":{"comment":"This lead has been inactive for 7 days."},"order":1,"continueOnFailure":true}]',
  'When a card is stuck in Lead for 7 days, set priority to high and add a comment',
  true,
  4
),
(
  'Welcome email on new lead',
  'Send a welcome email when a new card is created.',
  'sales',
  'card_created',
  '{}',
  '[]',
  '[{"id":"a1","type":"send_email","config":{"to":"{{card.assignee_email}}","subject":"New lead: {{card.title}}","body":"A new lead has been added to the pipeline."},"order":0,"continueOnFailure":true}]',
  'When a card is created, send a welcome email',
  false,
  5
),

-- ============================================================
-- DEVELOPMENT (6-8)
-- ============================================================
(
  'Add checklist on Design start',
  'Create a standard set of subtasks when a card enters Design.',
  'development',
  'card_moved_to',
  '{"columnId":"design"}',
  '[]',
  '[{"id":"a1","type":"create_subtask_set","config":{"tasks":"Review requirements\nCreate wireframes\nDesign mockups\nGet client approval"},"order":0,"continueOnFailure":true}]',
  'When a card moves to Design, create standard subtasks',
  true,
  6
),
(
  'Archive completed cards',
  'Automatically archive cards 3 days after moving to Completed.',
  'development',
  'card_stuck_in_column',
  '{"columnId":"completed","days":3}',
  '[]',
  '[{"id":"a1","type":"archive_card","config":{},"order":0,"continueOnFailure":false}]',
  'When a card is in Completed for 3 days, archive it',
  false,
  7
),
(
  'Notify assignee on card move',
  'Alert the assigned user when their card is moved to a new column.',
  'development',
  'card_moved_to',
  '{}',
  '[]',
  '[{"id":"a1","type":"notify_card_assignee","config":{"message":"Your card {{card.title}} was moved to a new column."},"order":0,"continueOnFailure":true}]',
  'When a card moves, notify the assignee',
  false,
  8
),

-- ============================================================
-- FINANCE (9-11)
-- ============================================================
(
  'Create invoice on Sale',
  'Automatically generate an invoice when a card reaches the Sale stage.',
  'finance',
  'card_moved_to',
  '{"columnId":"sale"}',
  '[]',
  '[{"id":"a1","type":"create_invoice","config":{},"order":0,"continueOnFailure":false}]',
  'When a card moves to Sale, create an invoice',
  true,
  9
),
(
  'Generate contract on Design',
  'Create a contract draft when a card enters the Design phase.',
  'finance',
  'card_moved_to',
  '{"columnId":"design"}',
  '[]',
  '[{"id":"a1","type":"generate_contract","config":{},"order":0,"continueOnFailure":false}]',
  'When a card moves to Design, generate a contract',
  false,
  10
),
(
  'Budget alert for high-value projects',
  'Notify the team when a high-priority card gets a due date set.',
  'finance',
  'card_due_date_set',
  '{}',
  '[{"id":"c1","field":"priority","operator":"equals","value":"high"}]',
  '[{"id":"a1","type":"notify_team","config":{"message":"Due date set for high-priority project: {{card.title}}"},"order":0,"continueOnFailure":true}]',
  'When a due date is set on a high-priority card, notify the team',
  false,
  11
),

-- ============================================================
-- ONBOARDING (12-14)
-- ============================================================
(
  'Onboarding checklist',
  'Add a standard onboarding checklist when a card is created.',
  'onboarding',
  'card_created',
  '{}',
  '[]',
  '[{"id":"a1","type":"create_subtask_set","config":{"tasks":"Send welcome packet\nSchedule kickoff call\nCollect project details\nSet up workspace\nSend first invoice"},"order":0,"continueOnFailure":true}]',
  'When a card is created, add onboarding subtasks',
  true,
  12
),
(
  'Assign and notify on new client',
  'Auto-assign a team member and notify them when a new card is created.',
  'onboarding',
  'card_created',
  '{}',
  '[]',
  '[{"id":"a1","type":"assign_random_from_group","config":{},"order":0,"continueOnFailure":true},{"id":"a2","type":"notify_card_assignee","config":{"message":"You have been assigned to onboard: {{card.title}}"},"order":1,"continueOnFailure":true}]',
  'When a card is created, assign someone and notify them',
  false,
  13
),
(
  'Due date reminder',
  'Send a notification when a due date is approaching.',
  'onboarding',
  'due_date_approaching',
  '{"daysBefore":2}',
  '[]',
  '[{"id":"a1","type":"notify_card_assignee","config":{"message":"Reminder: {{card.title}} is due in 2 days."},"order":0,"continueOnFailure":true}]',
  'When a due date is 2 days away, remind the assignee',
  true,
  14
),

-- ============================================================
-- PRODUCTIVITY (15-17)
-- ============================================================
(
  'Complete subtasks on archive',
  'Mark all subtasks as done when a card is archived.',
  'productivity',
  'card_archived',
  '{}',
  '[]',
  '[{"id":"a1","type":"complete_all_subtasks","config":{},"order":0,"continueOnFailure":true}]',
  'When a card is archived, complete all its subtasks',
  false,
  15
),
(
  'Auto-comment on priority change',
  'Leave a comment noting who changed the priority and when.',
  'productivity',
  'card_priority_changed',
  '{}',
  '[]',
  '[{"id":"a1","type":"add_automated_comment","config":{"comment":"Priority changed to {{card.priority}} by {{trigger.user}}."},"order":0,"continueOnFailure":true}]',
  'When priority changes, add a comment documenting it',
  false,
  16
),
(
  'Overdue escalation',
  'Escalate priority and notify the team when a due date passes.',
  'productivity',
  'due_date_passed',
  '{}',
  '[]',
  '[{"id":"a1","type":"set_priority","config":{"priority":"urgent"},"order":0,"continueOnFailure":true},{"id":"a2","type":"notify_team","config":{"message":"OVERDUE: {{card.title}} has passed its due date!"},"order":1,"continueOnFailure":true}]',
  'When a due date passes, escalate priority and notify team',
  true,
  17
),

-- ============================================================
-- AI-POWERED (18-20)
-- ============================================================
(
  'AI auto-tag new cards',
  'Use AI to automatically categorize and tag new cards.',
  'ai',
  'card_created',
  '{}',
  '[]',
  '[{"id":"a1","type":"ai_auto_tag","config":{},"order":0,"continueOnFailure":true}]',
  'When a card is created, AI adds relevant tags',
  true,
  18
),
(
  'AI summarize on completion',
  'Generate an AI summary when a card moves to Completed.',
  'ai',
  'card_moved_to',
  '{"columnId":"completed"}',
  '[]',
  '[{"id":"a1","type":"ai_summarize_card","config":{},"order":0,"continueOnFailure":true}]',
  'When a card moves to Completed, AI generates a summary',
  false,
  19
),
(
  'AI classify and route',
  'Use AI to classify a new card and move it to the right column.',
  'ai',
  'card_created',
  '{}',
  '[]',
  '[{"id":"a1","type":"ai_classify_card","config":{},"order":0,"continueOnFailure":true},{"id":"a2","type":"move_card","config":{"targetColumnId":"{{step.0.output.suggestedColumn}}"},"order":1,"continueOnFailure":true}]',
  'When a card is created, AI classifies it and moves it to the right column',
  true,
  20
);
