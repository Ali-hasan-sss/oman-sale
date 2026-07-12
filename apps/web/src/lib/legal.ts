import { api } from '@/lib/api';

export type LegalKind = 'terms' | 'privacy' | 'refund';

export type LegalDocumentContent = {
  kind: LegalKind;
  title: string;
  body: string;
  contactTitle: string;
  contactText: string;
  lastUpdated: string | null;
};

export async function fetchLegalDocument(kind: LegalKind, locale: 'ar' | 'en') {
  const response = await api.get<{ data: LegalDocumentContent }>(`/legal/${kind}`, {
    params: { locale }
  });
  return response.data.data;
}
