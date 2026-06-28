import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Locale } from '../types';

export type RegistrationDraftStep = 'email-code' | 'phone' | 'phone-code' | 'password';

export type RegistrationDraft = {
  step: RegistrationDraftStep;
  fullName: string;
  email: string;
  phone: string;
  locale: Locale;
  updatedAt: string;
};

const registrationDraftKey = 'oman_sale_registration_draft';

export async function loadRegistrationDraft(): Promise<RegistrationDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(registrationDraftKey);
    if (!raw) return null;
    const draft = JSON.parse(raw) as RegistrationDraft;
    if (!draft.email || !draft.step) return null;
    return draft;
  } catch {
    return null;
  }
}

export async function saveRegistrationDraft(
  draft: Omit<RegistrationDraft, 'updatedAt'>
): Promise<void> {
  const payload: RegistrationDraft = {
    ...draft,
    updatedAt: new Date().toISOString()
  };
  await AsyncStorage.setItem(registrationDraftKey, JSON.stringify(payload));
}

export async function clearRegistrationDraft(): Promise<void> {
  await AsyncStorage.removeItem(registrationDraftKey);
}
