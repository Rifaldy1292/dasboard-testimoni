export type Machine = {
  machineName: string
  runningTime: string
  status: 'Running' | 'Stopped' | 'Pending'
  quantity: number
}
