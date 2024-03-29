import UISClient from './adminclient';
import UISAdminClient from './adminclient';
import {
  TEST_APP_TOKEN,
  TEST_JWT,
  TEST_ADMIN_LIST_APPUSERS_RESPONSE,
  TEST_ADMIN_LIST_ENGAGEMENT_DATA,
  TEST_APP_USER_ID,
  TEST_ADMIN_CREATE_APPUSER_RESPONSE,
  TEST_ADMIN_CREATE_APP_USER_PROFILE,
  TEST_ADMIN_CREATE_USER_REGISTRATION_CODE_RESPONSE,
  TEST_ADMIN_APP_USER_URL,
  TEST_ADMIN_USER_REGISTRATION_CODE,
} from './mock_data';

const fetchImpl: any = (response: any, valid: boolean = true) => {
  return jest.fn().mockImplementation((url: string, init: object) => {
    return {
      ok: valid,
      json: () => response,
    };
  });
};

describe('UIS Admin Client', () => {
  it('Should throw if appToken is missing', () => {
    try {
      new UISAdminClient('', '');
    } catch (e) {
      expect(e).toBe('UIS Error: You must specify appToken');
    }
  });

  it('Should throw if JWT is missing', () => {
    try {
      new UISAdminClient(TEST_APP_TOKEN, '');
    } catch (e) {
      expect(e).toBe('UIS Error: You must specify a JWT');
    }
  });

  it('Should retrieve a list of App Users', async () => {
    const f = fetchImpl(TEST_ADMIN_LIST_APPUSERS_RESPONSE);
    const client = new UISAdminClient(TEST_APP_TOKEN, TEST_JWT, {
      fetch: f,
    });
    const resp = await client.listAppUsersForApp();
    expect(resp).toBe(TEST_ADMIN_LIST_APPUSERS_RESPONSE);
    expect(f).toHaveBeenCalled();
    expect(f).toHaveBeenCalledWith(`https://uis.example.com/apps/${TEST_APP_TOKEN}/appusers/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${TEST_JWT}`,
      },
    });
  });

  it('Should retrieve a list of App Users with pagination', async () => {
    const f = fetchImpl(TEST_ADMIN_LIST_APPUSERS_RESPONSE);
    const client = new UISAdminClient(TEST_APP_TOKEN, TEST_JWT, {
      fetch: f,
    });
    const resp = await client.listAppUsersForApp(2);
    expect(resp).toBe(TEST_ADMIN_LIST_APPUSERS_RESPONSE);
    expect(f).toHaveBeenCalled();
    expect(f).toHaveBeenCalledWith(
      `https://uis.example.com/apps/${TEST_APP_TOKEN}/appusers/?page=2`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TEST_JWT}`,
        },
      }
    );
  });

  it('Should retrieve CommonMetric data for an AppUser', async () => {
    const metricId = 'engagement';
    const fromTime = '2023-04-20T19:24:37.000Z';
    const toTime = '2023-08-28T17:43:12.000Z';
    const offset = 50;
    const f = fetchImpl(TEST_ADMIN_LIST_ENGAGEMENT_DATA);
    const client = new UISAdminClient(TEST_APP_TOKEN, TEST_JWT, {
      fetch: f,
    });
    const resp = await client.getCommonMetricDataForAppUser(
      metricId,
      TEST_APP_USER_ID,
      fromTime,
      toTime,
      offset
    );
    expect(resp).toBe(TEST_ADMIN_LIST_ENGAGEMENT_DATA);
    expect(f).toHaveBeenCalled();
    expect(f).toHaveBeenCalledWith(
      `https://uis.example.com/apps/${TEST_APP_TOKEN}/metrics/common/${metricId}/data/?app_user_id=${TEST_APP_USER_ID}&from=${fromTime}&to=${toTime}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TEST_JWT}`,
        },
      }
    );
  });

  it('Should create an App User', async () => {
    const f = fetchImpl(TEST_ADMIN_CREATE_APPUSER_RESPONSE);
    const client = new UISAdminClient(TEST_APP_TOKEN, TEST_JWT, {
      fetch: f,
    });
    const profile = TEST_ADMIN_CREATE_APP_USER_PROFILE;
    const body = new FormData();
    body.append('app', TEST_APP_TOKEN);
    body.append('profile', JSON.stringify(profile));
    const resp = await client.createAppUser(profile);
    expect(resp).toBe(TEST_ADMIN_CREATE_APPUSER_RESPONSE);
    expect(f).toHaveBeenCalled();
    expect(f).toHaveBeenCalledWith(`https://uis.example.com/app-users/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TEST_JWT}`,
      },
      body,
    });
  });

  it('Should create a User Registration Code', async () => {
    const f = fetchImpl(TEST_ADMIN_CREATE_USER_REGISTRATION_CODE_RESPONSE);
    const client = new UISAdminClient(TEST_APP_TOKEN, TEST_JWT, {
      fetch: f,
    });
    const body = new FormData();
    body.append('app_user', TEST_ADMIN_APP_USER_URL);
    body.append('code', TEST_ADMIN_USER_REGISTRATION_CODE);
    const resp = await client.createUserRegistrationCode(
      TEST_ADMIN_APP_USER_URL,
      TEST_ADMIN_USER_REGISTRATION_CODE
    );
    expect(resp).toBe(TEST_ADMIN_CREATE_USER_REGISTRATION_CODE_RESPONSE);
    expect(f).toHaveBeenCalled();
    expect(f).toHaveBeenCalledWith(`https://uis.example.com/codes/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TEST_JWT}`,
      },
      body,
    });
  });
});
