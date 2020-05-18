export interface StatusUpdate {    

    personId: number;    
    personLabel?: string;
    groupId?: number;
    groupLabel?: string;
    personStatus?: string;
    testId?: number;
    testLabel?: string;
    testStateKey?: string;
    testStateValue?: string;
    unitName?: string;
    unitLabel?: string;
    unitStateKey?: string;
    unitStateValue?: string;
    timestamp: number;
}
