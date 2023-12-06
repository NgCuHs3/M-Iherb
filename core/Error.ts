export const API_TEMPORARY_BAN = 696969;
export const ZIP_CODE_NOT_APPLIED = 789321;
export const TAB_UNACTIVE_ERROR = 123456;
export const PROBE_VETOR_PRODUCT_NOT_QUALIFIED = 131131;
export const HTTP_TOO_MANY_REQUEST = 429;

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
