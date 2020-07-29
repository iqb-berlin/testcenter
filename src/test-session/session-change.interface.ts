export interface SessionChange {
    personId: number;
    groupName: string;
    mode?: string;
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

export function isSessionChange(arg: any): arg is SessionChange {
    return (arg.personId !== undefined) && (arg.timestamp !== undefined) && (arg.groupName !== undefined);
}
