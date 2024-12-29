export type Machine = {
  machineName: string
  runningTime: string
  status: 'running' | 'stopped' | 'pending'
  quantity: number
}
