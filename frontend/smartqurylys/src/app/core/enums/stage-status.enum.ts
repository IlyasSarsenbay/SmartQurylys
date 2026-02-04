// Перечисление, определяющее возможные статусы этапа работ.
export enum StageStatus {
  WAITING = 'WAITING', // Этап ожидает начала.
  ACTIVE = 'ACTIVE', // Этап активен, в работе.
  COMPLETED = 'COMPLETED', // Этап завершен.
  ON_PAUSE = 'ON_PAUSE' // Этап приостановлен.
}