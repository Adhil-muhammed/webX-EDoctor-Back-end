export interface PatientRef {
  readonly id: string;
  readonly phoneNumber: string;
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

export const localization = {
  en: {
    bookingCreated: 'Booking created successfully.',
    bookingCancelled: 'Booking cancelled successfully.',
  },
  ml: {
    bookingCreated: 'ബുക്കിംഗ് വിജയകരമായി സൃഷ്ടിച്ചു.',
    bookingCancelled: 'ബുക്കിംഗ് വിജയകരമായി റദ്ദാക്കി.',
  },
} as const;
