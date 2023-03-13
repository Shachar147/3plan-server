export interface CreateBackupDto {
    tripBackup: 'jsonb'
    tripId: number
    requestUrl?: string;
    requestMethod?: string;
    requestPayload: 'jsonb'
}