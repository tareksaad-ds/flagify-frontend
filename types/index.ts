export type Project = {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export type Environment = {
  id: string
  project_id: string
  name: string
  created_at: string
}

export type Flag = {
  id: string
  project_id: string
  key: string
  name: string
  description: string | null
  created_at: string
}

export type Rule = {
  attribute: string
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt'
  value: string | number
}

export type FlagState = {
  environment_id: string
  environment_name: string
  enabled: boolean
  rollout_percentage: number
  rules: Rule[]
  updated_at: string
}

export type FlagWithStates = Flag & { states: FlagState[] }

export type SdkKey = {
  id: string
  project_id: string
  environment_id: string
  environment_name: string
  revoked: boolean
  created_at: string
}

export type SdkKeyCreated = {
  id: string
  project_id: string
  environment_id: string
  name: string
  key: string
  revoked: boolean
  created_at: string
}

export type AuditEntry = {
  id: string
  flag_id: string
  environment_id: string
  environment_name: string
  user_id: string
  user_email: string
  action: 'created' | 'enabled' | 'disabled' | 'updated'
  diff: {
    before: { enabled: boolean; rollout_percentage: number; rules: Rule[] } | null
    after: { enabled: boolean; rollout_percentage: number; rules: Rule[] }
  }
  created_at: string
}
