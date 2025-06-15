export interface User {
  uid: string
  email: string
  name: string
  role: "admin" | "user"
  photoURL?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface AuthService {
  setAuthToken: (token: string | null) => Promise<void>
  getUserData: (uid: string) => Promise<{ user: User }>
  handleGoogleSignIn: (data: {
    uid: string
    email: string
    name: string
    photoURL: string
  }) => Promise<{ user: User }>
  register: (data: RegisterData & { uid: string }) => Promise<{ user: User }>
}
