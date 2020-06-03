export interface StatusUpdate {

    personId: number;
    mode?: string;
    groupName?: string;
    groupLabel?: string;
    personStatus?: string;
    testId?: number;
    bookletName?: string;
    testState: {
        [testStateKey: string]: string
    };
    testStateKey?: string;
    testStateValue?: string;
    unitName?: string;
    unitState: {
        [unitStateKey: string]: string
    };
    timestamp: number;
}
