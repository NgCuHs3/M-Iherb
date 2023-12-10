export type AuthenticateState =
  | "authenticated"
  | "unauthenticated"
  | "another-authenticated";

class UserAuthentication {
  private accessToken: string;
  private authenticateApi: string = "http://localhost:8000";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private createRequest(payload: object | null, method: "POST"): RequestInit {
    const headers = new Headers({
      // using cookie is not allowed :))
      // https://stackoverflow.com/questions/34558264/fetch-api-with-cookiee,
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    });
    const request: RequestInit = {
      method,
      headers: headers,
      // this options got ingored :V
      credentials: "include",
      ...(payload && {
        body: JSON.stringify(payload),
      }),
    };
    return request;
  }

  public async authenticate(): Promise<AuthenticateState> {
    const url = `${this.authenticateApi}/login`;
    const requestInit = this.createRequest(null, "POST");
    try {
      // Use fetch to make the request
      const res = await fetch(url, requestInit);

      console.log("authenticate res", res);

      if (res.ok) return "authenticated";

      if (res.status === 401) return "another-authenticated";
    } catch {}
    return "unauthenticated";
  }

  public async logout(): Promise<void> {
    const url = `${this.authenticateApi}/logout`;
    const requestInit = this.createRequest(null, "POST");
    try {
      // Use fetch to make the request
      await fetch(url, requestInit);
    } catch (error) {}
  }
}

export default UserAuthentication;
