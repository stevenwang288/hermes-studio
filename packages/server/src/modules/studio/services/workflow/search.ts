export function filterWorkflowsByName<T extends { name: string }>(workflows: T[], query?: string | null): T[] {
  const needle = typeof query === 'string' ? query.trim().toLowerCase() : ''
  if (!needle) return workflows
  return workflows.filter(workflow => workflow.name.toLowerCase().includes(needle))
}
