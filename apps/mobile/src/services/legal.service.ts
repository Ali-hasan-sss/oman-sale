import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import type { Locale } from '../types';

export type LegalKind = 'terms' | 'privacy' | 'refund';

export type LegalDocumentContent = {
  kind: LegalKind;
  title: string;
  body: string;
  contactTitle: string;
  contactText: string;
  lastUpdated: string | null;
};

export async function fetchLegalDocument(kind: LegalKind, locale: Locale) {
  const response = await http.get<ApiEnvelope<LegalDocumentContent>>(API_ENDPOINTS.legal.byKind(kind), {
    params: { locale }
  });
  return response.data.data;
}
