interface IUISAdminClient {
  listAppUsers(): Promise<Response>;
  createAppUser(profile?: object): Promise<object>;
  updateAppUser(appUserId: string, profile: object): Promise<object>;
  createUserRegistrationCode(appUserURL: string, code: string): Promise<object>;
}

interface IOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface IdentityOptions {}

const defaultOptions = {
  baseUrl: 'https://uis.example.com/',
  fetch: undefined,
};

const pathMap: { [key: string]: string } = {
  listAllAppUsers: 'app-users/',
  listAppUsersForApp: 'apps/{{appToken}}/appusers/',
  createAppUser: 'app-users/',
  updateAppUser: 'apps/{{appToken}}/appusers/{{appUserId}}/',
  createUserRegistrationCode: 'codes/',
};

const UISError = (message: string) => `UIS Error: ${message}`;

const UISAPIError = (message: string, response: Response) => ({
  message: `UIS API Error: ${message}`,
  response,
});

class UISAdminClient implements IUISAdminClient {
  private options: IOptions;
  private fetch: typeof fetch;

  constructor(private appToken: string, private jwt: string, options?: IOptions) {
    if (!appToken) {
      throw UISError('You must specify appToken');
    }
    if (!jwt) {
      throw UISError('You must specify a JWT');
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
    this.options.baseUrl = this.options.baseUrl?.replace('{{app_ubiquity_token}}', this.appToken);
  }

  private getUrl(endpoint: string, page?: number | undefined) {
    let result;
    result = `${this.options.baseUrl}${pathMap[endpoint]}`;
    if (page) {
      result += `?page=${page}`;
    }

    result = result.replace('{{appToken}}', this.appToken);
    return result;
  }

  listAppUsersForApp = async (page?: number | undefined) => {
    const url = this.getUrl('listAppUsersForApp', page);
    const resp = await this.fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to get list of App Users', resp);
    }
    const data = await resp.json();
    return data;
  };

  listAllAppUsers = async (page?: number | undefined) => {
    const url = this.getUrl('listAllAppUsers', page);
    const resp = await this.fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to get list of App Users', resp);
    }
    const data = await resp.json();
    return data;
  };

  // for legacy calls
  listAppUsers = this.listAllAppUsers;

  createAppUser = async (profile?: object) => {
    const url = this.getUrl('createAppUser');
    const body = new FormData();
    body.append('app', this.appToken);
    if (profile) {
      body.append('profile', JSON.stringify(profile));
    }
    const resp = await this.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
      body,
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to create App User', resp);
    }
    const data = await resp.json();
    return data;
  };

  updateAppUser = async (appUserId: string, profile: object, disabled?: boolean) => {
    const url = this.getUrl('updateAppUser').replace('{{appUserId}}', `${appUserId}`);
    const body = new FormData();
    body.append('app', this.appToken);
    body.append('profile', JSON.stringify(profile));
    if (disabled !== undefined) {
      body.append('disabled', `${disabled}`);
    }
    const resp = await this.fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
      body,
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to update App User', resp);
    }
    const data = await resp.json();
    return data;
  };

  createUserRegistrationCode = async (appUserURL: string, code: string) => {
    const url = this.getUrl('createUserRegistrationCode');
    const body = new FormData();
    body.append('app_user', appUserURL);
    body.append('code', code);
    const resp = await this.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
      body,
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to create User Registration Code', resp);
    }
    const data = await resp.json();
    return data;
  };
}

export default UISAdminClient;
export { IUISAdminClient, IOptions, IdentityOptions };
