'use client';

import type { PhoneVerificationChannel } from '@/components/auth/phone-verification-resend';

type PhoneVerificationSentNoticeProps = {
  phone: string;
  channel: PhoneVerificationChannel;
  sentToLabel: (phone: string) => string;
  changePhoneLabel: string;
  channelHintWhatsapp: string;
  channelHintSms: string;
  onChangePhone: () => void;
  disabled?: boolean;
};

export function PhoneVerificationSentNotice({
  phone,
  channel,
  sentToLabel,
  changePhoneLabel,
  channelHintWhatsapp,
  channelHintSms,
  onChangePhone,
  disabled
}: PhoneVerificationSentNoticeProps) {
  return (
    <div className="mb-6 rounded-xl border border-green-100 bg-green-50/60 px-4 py-3 text-center">
      <p className="text-sm text-gray-700">
        {sentToLabel(phone)}{' '}
        <span dir="ltr" className="font-bold text-gray-900">
          {phone}
        </span>
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {channel === 'whatsapp' ? channelHintWhatsapp : channelHintSms}
      </p>
      <button
        type="button"
        onClick={onChangePhone}
        disabled={disabled}
        className="mt-2 text-sm font-bold text-green-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-70"
      >
        {changePhoneLabel}
      </button>
    </div>
  );
}
