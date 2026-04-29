/* eslint-disable */
'use server';
// maybe switch to https://www.npmjs.com/package/@paypal/paypal-server-sdk later
import { env } from '@/env';

//  this is a temporary fix to allow apple pay to work, it will be removed when we have a proper solution
const CURRENCY = 'GBP';

export async function getPaypalAccessToken() {
  try {
    const response = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${env.PAYPAL_APP_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to get PayPal access token', error);
      throw new Error('Failed to get PayPal access token');
    }

    const { access_token } = await response.json();

    return {
      access_token,
      success: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      success: false,
    };
  }
}

export async function createOrder(
  orderId: string,
  totalPrice: number,
  given_name: string,
  email: string,
  surname: string,
): Promise<
  | {
      error: string;
      success: false;
      id?: undefined;
    }
  | {
      id: string;
      success: true;
      error?: undefined;
    }
> {
  try {
    const response = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await getPaypalAccessToken()).access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            amount: {
              currency_code: CURRENCY,
              value: totalPrice.toString(),
            },
          },
        ],
        application_context: {
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
        payer: {
          email_address: email,
          name: {
            given_name,
            surname,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create PayPal order', error);
      throw new Error('Failed to create PayPal order');
    }

    const data = await response.json();
    return {
      id: data.id,
      success: true,
    };
  } catch (error) {
    console.error('Failed to create PayPal order', error);
    return {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      success: false,
    };
  }
}

export async function getClientToken(): Promise<
  | {
      error: string;
      success: false;
      client_token?: undefined;
    }
  | {
      client_token: string;
      success: true;
      error?: undefined;
    }
> {
  try {
    const response = await fetch(
      `${env.PAYPAL_API_BASE}/v1/identity/generate-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await getPaypalAccessToken()).access_token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to get PayPal client token', error);
      throw new Error('Failed to get PayPal client token');
    }
    //TODO: double check the typing here?
    const { client_token } = await response.json();

    return {
      client_token,
      success: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      success: false,
    };
  }
}

// TODO: need to check the paypla/types docs for the correct one,
interface CaptureData {
  id: string;
  status: 'COMPLETED' | 'DECLINED';
  payment_source: {
    paypal: {
      email_address: string;
      account_id: string;
      name: {
        given_name: string;
        surname: string;
      };
      address: {
        country_code: string;
      };
    };
  };
  purchase_units: Array<{
    reference_id: string;
    shipping: {
      address: {
        address_line_1: string;
        admin_area_2: string;
        admin_area_1: string;
        postal_code: string;
        country_code: string;
      };
    };
    payments: {
      captures: Array<{
        id: string;
        status: 'COMPLETED' | 'DECLINED';
        amount: {
          currency_code: string;
          value: string;
        };
        final_capture: boolean;
        seller_protection: {
          status: string;
          dispute_categories: string[];
        };
        create_time: string;
        update_time: string;
      }>;
    };
  }>;
  payer: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    payer_id: string;
  };
  create_time: string;
  update_time: string;
}

export async function captureOrder(orderId: string): Promise<
  | {
      error: string;
      success: false;
      captureData?: undefined;
    }
  | {
      captureData: CaptureData;
      success: true;
      error?: undefined;
    }
> {
  try {
    console.log('capturing order', orderId);
    const response = await fetch(
      `${env.PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await getPaypalAccessToken()).access_token}`,
          'PayPal-Request-Id': orderId, // Prevent duplicate captures
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to capture PayPal order', error);
      throw new Error('Failed to capture PayPal order');
    }
    //TODO: here we might do the extar order creation as well as the proccesing, since this is a server action we might as well  confim and login the user
    return {
      success: true,
      captureData: await response.json(),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      success: false,
    };
  }
}
