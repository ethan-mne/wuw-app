export const OTP_CODE_REGEX = /^\d{6}$/;

export type OTPCredentials =
  | {
      otpID?: string;
      otp?: string;
    }
  | undefined
  | null;

type OTPUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type OTPRecord = {
  id: string;
  user: OTPUser;
};

type OTPModel = {
  findFirst: (args: {
    where: {
      id: string;
      otp: string;
      used: false;
      expires: {
        gte: Date;
      };
    };
    include: {
      user: true;
    };
  }) => Promise<OTPRecord | null>;
  update: (args: {
    where: {
      id: string;
    };
    data: {
      used: true;
    };
  }) => Promise<unknown>;
};

export const isValidOtpCode = (value: string) => OTP_CODE_REGEX.test(value);

export const parseOTPCredentials = (credentials: OTPCredentials) => {
  const otpID = credentials?.otpID?.trim();
  const otp = credentials?.otp?.trim();

  if (!otpID || !otp || !isValidOtpCode(otp)) {
    return null;
  }

  return {
    otpID,
    otp,
  };
};

export const authorizeOtpCredentials = async (
  credentials: OTPCredentials,
  otpModel: OTPModel,
): Promise<OTPUser | null> => {
  const parsedCredentials = parseOTPCredentials(credentials);
  if (!parsedCredentials) {
    return null;
  }

  const otp = await otpModel.findFirst({
    where: {
      id: parsedCredentials.otpID,
      otp: parsedCredentials.otp,
      used: false,
      expires: {
        gte: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!otp) {
    return null;
  }

  await otpModel.update({
    where: { id: otp.id },
    data: {
      used: true,
    },
  });

  return otp.user;
};
