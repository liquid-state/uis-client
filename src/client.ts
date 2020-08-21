interface IUISAdminClient {
  register(username: string, password?: string): Promise<Response>;
  getProfile(): Promise<object>;
}

interface IOptions {
  baseUrl?: string;
  identity?: IdentityOptions;
}

interface IdentityOptions {
  jwt?: string;
}

const defaultOptions = {
  baseUrl: 'https://cloud.liquid-state.com/',
  identity: {},
};

const pathMap: { [key: string]: string } = {
  appPublicConfig: 'c/{{companyToken}}/apps/{{appToken}}/app.json',
  registration: 'api/appusers/v1/{{appToken}}/register/',
  getProfile: 'api/appusers/v1/{{appToken}}/profile/',
  setProfile: 'api/appusers/v1/{{appToken}}/profile/set/',
  appConfig: 'c/{{companyToken}}/apps/{{appToken}}/app_users/{{appUserId}}/app_config.json',
  messageHistory:
    'c/{{companyToken}}/apps/{{appToken}}/app_users/{{appUserId}}/messaging/list.json',
  viewableIssues: 'c/{{companyToken}}/apps/{{appToken}}/app_users/{{appUserId}}/app_config.json',
};

const UISError = (message: string) => `UIS Error: ${message}`;

const UISAPIError = (message: string, response: Response) => ({
  message: `UIS API Error: ${message}`,
  response,
});

class UISAdminClient implements IUISAdminClient {
  private options: IOptions;

  constructor(private appToken: string, options?: IOptions) {
    if (!appToken) {
      throw UISError('You must specify an appToken');
    }
    if (!options) {
      this.options = defaultOptions;
    } else {
      this.options = { ...defaultOptions, ...options };
      if (!this.options.baseUrl) {
        this.options.baseUrl = defaultOptions.baseUrl;
      }
    }
  }

  register = (username: string, password?: string) => {
    const url = this.getUrl('registration');
    const body = new FormData();
    body.append('json_data', JSON.stringify({ username, password }));
    return fetch(url, {
      method: 'POST',
      body,
    });
  };

  getProfile = async () => {
    const url = this.getUrl('getProfile');
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${await this.jwt()}`,
      },
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to get profile for user', resp);
    }
    const content = await resp.json();
    return content.data;
  };

  private getUrl(endpoint: string, useS3 = false) {
    let result;
    result = `${this.options.baseUrl}${pathMap[endpoint]}`;
    result = result.replace('{{appToken}}', this.appToken);
    return result;
  }

  private async jwt() {
    if (!this.options.identity) {
      return undefined;
    }
    if (this.options.identity.jwt) {
      return this.options.identity.jwt;
    }
    return undefined;
  }

  private sub(jwt: string) {
    // Get the body of the JWT.
    const payload = jwt.split('.')[1];
    // Which is base64 encoded.
    const parsed = JSON.parse(atob(payload));
    return parsed.sub;
  }
}

export default UISAdminClient;
export { IUISAdminClient, IOptions, IdentityOptions };
