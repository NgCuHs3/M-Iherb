export const ZIP_CODE_NOT_APPLIED = 789321;
export const TAB_UNACTIVE_ERROR = 123456;

export class IherbApiError extends Error {
  public message: string = "Unkown error";
  public code: number = 0;
  constructor(message: string, code: number) {
    // Calling the constructor of the base class (Error)
    super(message);

    this.message = message;
    this.code = code;
  }
}
