export interface BaseUser {
  username: string;
  user_color: string;
}

export type User = BaseUser & {
  user_id: string;
};
