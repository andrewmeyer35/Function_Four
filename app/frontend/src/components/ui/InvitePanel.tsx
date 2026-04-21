'use client'
import { useState } from 'react'

type Props = {
  householdName: string
  inviteCode: string
}

export function InvitePanel({ householdName, inviteCode }: Props) {
  const [phone, setPhone] = useState('')
  const [phones, setPhones] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  function inviteUrl() {
    return `${window.location.origin}/onboarding?invite=${inviteCode}`
  }

  function smsMessage() {
    return `Hey! Join me on Four Fs — we track financial, fitness, fun and relationship goals together. Use this link to join our household "${householdName}": ${inviteUrl()}`
  }

  function addPhone() {
    const cleaned = phone.replace(/\s/g, '')
    if (!cleaned) return
    setPhones((prev) => [...prev.filter((p) => p !== cleaned), cleaned])
    setPhone('')
  }

  function removePhone(p: string) {
    setPhones((prev) => prev.filter((x) => x !== p))
  }

  function sendSms() {
    if (phones.length === 0) return
    const body = encodeURIComponent(smsMessage())
    // iOS uses & separator, Android uses ;
    // Most devices handle comma-separated numbers in the to field
    const to = phones.join(',')
    window.open(`sms:${to}?&body=${body}`, '_self')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback — select a temp input
    }
  }

  async function nativeShare() {
    if (!navigator.share) return
    await navigator.share({
      title: 'Join me on Four Fs',
      text: smsMessage(),
      url: inviteUrl(),
    })
  }

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className="space-y-3">

      {/* Household info */}
      <div className="surface-card rounded-2xl px-4 py-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Your household
        </p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-gray-900">{householdName}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Invite code:{' '}
              <span className="font-mono font-semibold text-gray-700 tracking-wider">
                {inviteCode}
              </span>
            </p>
          </div>
          <button
            onClick={copyLink}
            className="flex-shrink-0 px-3 py-2 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      {/* Invite via SMS */}
      <div className="surface-card rounded-2xl px-4 py-4 space-y-4">
        <div>
          <p className="text-sm font-bold text-gray-900">Invite roommates</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Add phone numbers and send an SMS with the join link.
          </p>
        </div>

        {/* Phone input */}
        <div className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhone())}
            placeholder="+1 555 000 0000"
            className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300"
          />
          <button
            onClick={addPhone}
            className="h-10 px-4 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            Add
          </button>
        </div>

        {/* Added numbers */}
        {phones.length >= 1 && (
          <div className="flex flex-wrap gap-2">
            {phones.map((p) => (
              <div
                key={p}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
              >
                <span className="font-mono">{p}</span>
                <button
                  onClick={() => removePhone(p)}
                  className="text-indigo-400 hover:text-indigo-700 leading-none"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Send buttons */}
        <div className="flex gap-2">
          <button
            onClick={sendSms}
            disabled={phones.length === 0}
            className="flex-1 h-10 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Send SMS{phones.length >= 1 ? ` (${phones.length})` : ''}
          </button>

          {canNativeShare && (
            <button
              onClick={nativeShare}
              className="h-10 px-4 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          Your roommate will create an account and the join link auto-fills their invite code.
        </p>
      </div>
    </div>
  )
}
