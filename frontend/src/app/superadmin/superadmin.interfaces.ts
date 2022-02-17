export interface NameOnly {
  name: string;
}

export interface IdAndName {
  id: number;
  name: string;
}

export interface IdLabelSelectedData {
  id: number;
  label: string;
  selected: boolean;
}

export interface IdRoleData {
  id: number;
  label: string;
  role: string;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  isSuperadmin: boolean;
  selected: boolean;
}
