export interface PatientRef {
  readonly id: string;
  readonly phoneNumber: string;
  readonly email?: string;
}

export interface ProviderRef {
  readonly id: string;
  readonly displayName: string;
  readonly specialty: string;
}

export interface BookingDto {
  readonly id: string;
  readonly patientId: string;
  readonly providerId: string;
  readonly startsAt: string;
  readonly status: 'pending' | 'confirmed' | 'cancelled';
}

export interface RequestOtpDto {
  readonly email: string;
}

export interface VerifyOtpDto {
  readonly email: string;
  readonly code: string;
}

export interface TokenPairDto {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface RefreshTokenDto {
  readonly refreshToken: string;
}

export interface OtpResponseDto {
  readonly expiresInSeconds: number;
}

export const localization = {
  en: {
    bookingCreated: 'Your booking has been created.',
    bookingCancelled: 'Your booking has been cancelled.',
    otpRequested: 'Your OTP has been sent to your email.',
    otpInvalid: 'Invalid or expired OTP. Please try again.',
    otpMaxAttempts: 'Too many incorrect attempts. Please request a new OTP.',
  },
  ml: {
    bookingCreated: 'നിങ്ങളുടെ ബുക്കിംഗ് സൃഷ്ടിച്ചു.',
    bookingCancelled: 'നിങ്ങളുടെ ബുക്കിംഗ് റദ്ദ് ചെയ്തു.',
    otpRequested: 'OTP നിങ്ങളുടെ ഇമെയിലിൽ അയച്ചു.',
    otpInvalid: 'OTP തെറ്റായതോ കാലഹരണപ്പെട്ടതോ ആണ്. വീണ്ടും ശ്രമിക്കുക.',
    otpMaxAttempts: 'നിരവധി തെറ്റായ ശ്രമങ്ങൾ. പുതിയ OTP അഭ്യർഥിക്കുക.',
  },
} as const;
