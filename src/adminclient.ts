interface IUISAdminClient {
  listAppUsers(): Promise<Response>;
  createAppUser(profile?: object): Promise<object>;
  createUserRegistrationCode(appUserURL: string, code: string): Promise<object>;
}

interface IOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface IdentityOptions {}

const defaultOptions = {
  baseUrl: "https://uis.example.com/",
  fetch: undefined
};

const pathMap: { [key: string]: string } = {
  listAppUsers: "app-users/",
  createAppUser: "app-users/",
  createUserRegistrationCode: "codes/"
};

const UISError = (message: string) => `UIS Error: ${message}`;

const UISAPIError = (message: string, response: Response) => ({
  message: `UIS API Error: ${message}`,
  response
});

class UISAdminClient implements IUISAdminClient {
  private options: IOptions;
  private fetch: typeof fetch;

  constructor(
    private appToken: string,
    private jwt: string,
    options?: IOptions
  ) {
    if (!appToken) {
      throw UISError("You must specify appToken");
    }
    if (!jwt) {
      throw UISError("You must specify a JWT");
    }
    if (!options) {
      this.options = defaultOptions;
    } else {
      this.options = { ...defaultOptions, ...options };
      if (!this.options.baseUrl) {
        this.options.baseUrl = defaultOptions.baseUrl;
      }
    }
    this.fetch = this.options.fetch || window.fetch.bind(window);
    this.options.baseUrl = this.options.baseUrl?.replace(
      "{{app_ubiquity_token}}",
      this.appToken
    );
  }

  listAppUsers = async () => {
    const url = this.getUrl("listAppUsers");
    const resp = await this.fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.jwt}`
      }
    });
    if (!resp.ok) {
      throw UISAPIError("Unable to get list of App Users", resp);
    }
    const data = await resp.json();
    return data;
  };

  createAppUser = async (profile?: object) => {
    const url = this.getUrl("createAppUser");
    const body = new FormData();
    body.append("app", this.appToken);
    if (profile) {
      body.append("profile", JSON.stringify(profile));
    }
    const resp = await this.fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.jwt}`
      },
      body
    });
    if (!resp.ok) {
      throw UISAPIError("Unable to create App User", resp);
    }
    const data = await resp.json();
    return data;
  };

  createUserRegistrationCode = async (appUserURL: string, code: string) => {
    const url = this.getUrl("createUserRegistrationCode");
    const body = new FormData();
    body.append("app_user", appUserURL);
    body.append("code", code);
    const resp = await this.fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.jwt}`
      },
      body
    });
    if (!resp.ok) {
      throw UISAPIError("Unable to create User Registration Code", resp);
    }
    const data = await resp.json();
    return data;
  };

  // register = (username: string, password?: string) => {
  //   const url = this.getUrl("registration");
  //   const body = new FormData();
  //   body.append("json_data", JSON.stringify({ username, password }));
  //   return fetch(url, {
  //     method: "POST",
  //     body
  //   });
  // };

  // getProfile = async () => {
  //   const url = this.getUrl("getProfile");
  //   const resp = await fetch(url, {
  //     headers: {
  //       Authorization: `Bearer ${await this.jwt()}`
  //     }
  //   });
  //   if (!resp.ok) {
  //     throw UISAPIError("Unable to get profile for user", resp);
  //   }
  //   const content = await resp.json();
  //   return content.data;
  // };

  private getUrl(endpoint: string, useS3 = false) {
    let result;
    result = `${this.options.baseUrl}${pathMap[endpoint]}`;
    result = result.replace("{{appToken}}", this.appToken);
    return result;
  }

  // private async jwt() {
  //   if (!this.options.identity) {
  //     return undefined;
  //   }
  //   if (this.options.identity.jwt) {
  //     return this.options.identity.jwt;
  //   }
  //   return undefined;
  // }

  // private sub(jwt: string) {
  //   // Get the body of the JWT.
  //   const payload = jwt.split(".")[1];
  //   // Which is base64 encoded.
  //   const parsed = JSON.parse(atob(payload));
  //   return parsed.sub;
  // }
}

export default UISAdminClient;
export { IUISAdminClient, IOptions, IdentityOptions };