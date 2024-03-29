import {
  ListFilesResponse,
  CreateFileData,
  AppUserFile,
  UpdateFileData,
  CommonMetricDataResponse,
} from './types';

interface IUISAdminClient {
  listAppUsers(): Promise<Response>;
  createAppUser(profile?: object): Promise<object>;
  updateAppUser(appUserId: string, profile: object): Promise<object>;
  createUserRegistrationCode(
    appUserURL: string,
    code: string,
    additionalContext?: object
  ): Promise<object>;
  listAppUserFiles(appUserId: string): Promise<ListFilesResponse>;
  createAppUserFile(appUserId: string, data: CreateFileData): Promise<AppUserFile>;
  getAppUserFileUploadUrl(file: AppUserFile): Promise<{ url: string }>;
  appUserFileUploadComplete(file: AppUserFile): Promise<AppUserFile>;
  getAppUserFileDownloadUrl(file: AppUserFile): Promise<{ url: string }>;
  deleteAppUserFile(file: AppUserFile): Promise<void>;
  updateAppUserFile(file: AppUserFile, data: UpdateFileData): Promise<AppUserFile>;
  getCommonMetricDataForAppUser(
    metricId: string,
    appUserId: string,
    fromTime?: string,
    toTime?: string,
    offset?: number
  ): Promise<CommonMetricDataResponse>;
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
  files: 'app-users/{{appUserId}}/files/',
  commonMetricData: 'apps/{{appToken}}/metrics/common/{{metricId}}/data/',
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

  createUserRegistrationCode = async (
    appUserURL: string,
    code: string,
    additionalContext?: object
  ) => {
    const url = this.getUrl('createUserRegistrationCode');
    const body = new FormData();
    body.append('app_user', appUserURL);
    body.append('code', code);
    if (additionalContext !== undefined) {
      body.append('additional_context', JSON.stringify(additionalContext));
    }
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

  listAppUserFiles = async (appUserId: string) => {
    const url = this.getUrl('files').replace('{{appUserId}}', `${appUserId}`);
    const resp = await this.fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to get app user files', resp);
    }
    const data = await resp.json();
    return data;
  };

  createAppUserFile = async (appUserId: string, data: CreateFileData) => {
    const url = this.getUrl('files').replace('{{appUserId}}', `${appUserId}`);
    const resp = await this.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to create the app user file', resp);
    }
    const jsonResp = await resp.json();
    return jsonResp;
  };

  getAppUserFileUploadUrl = async (file: AppUserFile) => {
    const url = `${file.url}upload/`;
    const resp = await this.fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    });
    if (resp.status === 409) {
      throw UISAPIError('File already uploaded', resp);
    }
    if (!resp.ok) {
      throw UISAPIError('Unable to get upload url for file', resp);
    }
    const data = await resp.json();
    return data;
  };

  appUserFileUploadComplete = async (file: AppUserFile) => {
    const url = `${file.url}upload_complete/`;
    const resp = await this.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to set upload complete on file', resp);
    }
    const data = await resp.json();
    return data;
  };

  getAppUserFileDownloadUrl = async (file: AppUserFile) => {
    const url = `${file.url}download/`;
    const resp = await this.fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to get the app user file download URL', resp);
    }
    const data = await resp.json();
    return data;
  };

  deleteAppUserFile = async (file: AppUserFile) => {
    const resp = await this.fetch(file.url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    });
    if (resp.status === 403) {
      throw UISAPIError(
        'The user is not the creator thus does not have the permission to delete the file',
        resp
      );
    }
    if (!resp.ok) {
      throw UISAPIError('Unable to delete the app user file', resp);
    }
    return;
  };

  updateAppUserFile = async (file: AppUserFile, data: UpdateFileData) => {
    const resp = await this.fetch(file.url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (resp.status === 403) {
      throw UISAPIError(
        'The user is not the creator thus does not have the permission to edit the file',
        resp
      );
    }
    if (!resp.ok) {
      throw UISAPIError('Unable to edit the app user file', resp);
    }
    const jsonResp = await resp.json();
    return jsonResp;
  };

  getCommonMetricDataForAppUser = async (
    metricId: string,
    appUserId: string,
    fromTime?: string,
    toTime?: string,
    offset?: number
  ) => {
    let url = this.getUrl('commonMetricData').replace('{{metricId}}', metricId);
    url += `?app_user_id=${appUserId}`;
    url += `${fromTime ? `&from=${fromTime}` : ''}`;
    url += `${toTime ? `&to=${toTime}` : ''}`;
    url += `${offset ? `&offset=${offset}` : ''}`;
    const resp = await this.fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    });
    if (!resp.ok) {
      throw UISAPIError('Unable to get app user files', resp);
    }
    const data = await resp.json();
    return data;
  };
}

export default UISAdminClient;
export { IUISAdminClient, IOptions, IdentityOptions };
