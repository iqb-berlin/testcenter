export const commandKeywords = [
  'pause',
  'goto',
  'terminate',
  'resume',
  'debug'
];

export interface Command {
  keyword: (typeof commandKeywords)[number];
  id: string; // a unique id for each command, to make sure each one get only performed once (even in polling mode)
  arguments: string[];
  timestamp?: number;
}

export function isCommand(arg: any): arg is Command {
  return (arg.keyword !== undefined) && (arg.id !== undefined) && (arg.arguments !== undefined);
}
