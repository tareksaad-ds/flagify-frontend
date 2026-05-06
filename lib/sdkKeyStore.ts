const PREFIX = 'flagify-sdk-key'

export function storeSdkKey(projectId: string, environmentId: string, rawKey: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${PREFIX}-${projectId}-${environmentId}`, rawKey)
}

export function getSdkKey(projectId: string, environmentId: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(`${PREFIX}-${projectId}-${environmentId}`)
}

export function getSdkKeysForProject(
  projectId: string,
  environmentIds: string[]
): Array<{ environmentId: string; sdkKey: string }> {
  return environmentIds
    .map(envId => ({ environmentId: envId, sdkKey: getSdkKey(projectId, envId) }))
    .filter((c): c is { environmentId: string; sdkKey: string } => c.sdkKey !== null)
}
