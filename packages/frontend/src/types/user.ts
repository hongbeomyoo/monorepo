import { SSOAccountJSON } from '@team-10/lib';

export interface MeInfo {
  stringId: string;
  displayName: string;
  profileImage: string;
  initialized: boolean;
  ssoAccounts: SSOAccountJSON[];
}

export interface ClassroomMember {
  userId: string;
  displayName: string;
  profileImage: string;
}
