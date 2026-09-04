export type AuthenticatedUser = Readonly<{
  id: string;
  email: string | null;
}>;

export type AuthActionState = Readonly<{
  status: "idle" | "error" | "success";
  message: string;
  email: string;
}>;

export const initialAuthActionState: AuthActionState = {
  status: "idle",
  message: "",
  email: "",
};
