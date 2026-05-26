export type { Database } from "./database";

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};
