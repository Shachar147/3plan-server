export interface CreateHistoryDto {
    tripId: number,
    eventId?: number,
    eventName?: string,
    action: string
    actionParams?: 'jsonb'
}