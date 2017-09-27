export class DBBlockedError extends Error {
  message:string = "Database is blocked by another process!";
}
