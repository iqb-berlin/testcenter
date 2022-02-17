export interface Monitor {
  token: string;
  groups: string[]
}

export function isMonitor(arg: any): arg is Monitor {
  return (arg.token !== undefined) && (arg.groups !== undefined);
}
