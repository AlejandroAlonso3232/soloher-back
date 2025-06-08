// export class S3Error extends Error {
//   public code: string;
//   public details: Record<string, any>;

//   constructor(code: string, message: string, details: Record<string, any> = {}) {
//     super(message);
//     this.name = "S3Error";
//     this.code = code;
//     this.details = details;
//   }
// }

export class MegaError extends Error {
  public code: string;
  public details: Record<string, any>;

  constructor(code: string, message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = "MegaError";
    this.code = code;
    this.details = details;
  }
}