export class User {
  userId: number;
  username: string;
  real_name: string;
  access_method: string;
  password: string;
  description: string;
  confirmPassword: string;
  role_id: number;
  blockUntil?: string;
}
