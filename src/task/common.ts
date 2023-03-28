import {Distance} from "../distance/distance.entity";

export enum TaskType {
    calcDistance = 'calcDistance'
}

export enum TaskStatus {
    pending = 'pending',
    inProgress = 'inProgress',
    failed = 'failed',
    succeeded = 'succeeded'
}

export interface TaskCreatedResult {
    taskId: number;
}

export interface TripRoutesResult {
    total: number;
    results: Distance[]
}