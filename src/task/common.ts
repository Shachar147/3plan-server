import {Distance} from "../distance/distance.entity";

export enum TaskType {
    calcDistance = 'calcDistance'
}

export enum TaskStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    FAILED = 'FAILED',
    SUCCEEDED = 'SUCCEEDED'
}

export interface TaskCreatedResult {
    taskId: number;
}

export interface TripRoutesResult {
    total: number;
    results: Distance[]
}