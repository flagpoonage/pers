export interface BaseUser {
  userName: string;
  userColor: string;
}

export type OtherUser = BaseUser & {
  userId: string;
};

export type SelfUser = OtherUser & {
  authenticated: boolean;
};

export type User = SelfUser | OtherUser;
