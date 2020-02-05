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

  private getUrl(
    endpoint: string,
    queryStringParameters?: { [key: string]: any }
  ) {
    let result;
    result = `${this.options.baseUrl}${pathMap[endpoint]}`;
    if (queryStringParameters) {
      const qsKeys = Object.keys(queryStringParameters);
      if (qsKeys.length) {
        const parts = qsKeys.map(k => `${k}=${queryStringParameters[k]}`);
        result += `?${parts.join("&")}`;
      }
    }

    result = result.replace("{{appToken}}", this.appToken);
    return result;
  }

  listAppUsers = async (
    limit?: number | undefined,
    offset?: number | undefined
  ) => {
    let queryStringParams: { [key: string]: any } = {};
    if (limit) {
      queryStringParams["limit"] = limit;
    }
    if (offset) {
      queryStringParams["offset"] = offset;
    }
    const url = this.getUrl("listAppUsers", queryStringParams);
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
}

export default UISAdminClient;
export { IUISAdminClient, IOptions, IdentityOptions };
