import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Copy, Check, ExternalLink, Mail, Linkedin, MessageSquare,
  ChevronLeft, ChevronRight, Building2, Send, AlertCircle, Filter,
  CheckCircle, TrendingUp
} from 'lucide-react'
import { messages } from '../api/client'
import clsx from 'clsx'

function ChannelBadge({ channel }) {
  const config = {
    email: { icon: Mail, color: 'bg-green-100 text-green-700', label: 'Email' },
    linkedin: { icon: Linkedin, color: 'bg-blue-100 text-blue-700', label: 'LinkedIn' },
    inmail: { icon: MessageSquare, color: 'bg-blue-100 text-blue-700', label: 'InMail' },
  }
  const { icon: Icon, color, label } = config[channel] || config.email
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', color)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  )
}

function ApprovedMessageCard({ message, onMarkSent }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const gmailUrl = message.prospect?.email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(message.prospect.email)}&su=${encodeURIComponent(message.subject || '')}&body=${encodeURIComponent(message.content)}`
    : null

  const salesNavUrl = message.prospect?.linkedin_url
    ? `https://www.linkedin.com/sales/people/${message.prospect.linkedin_url.split('/in/')[1]?.replace('/', '')}`
    : null

  const linkedinUrl = message.prospect?.linkedin_url

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {message.prospect?.full_name?.[0] || 'P'}
            </div>
            <div>
              <Link
                to={`/prospects/${message.prospect_id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {message.prospect?.full_name || 'Unknown Prospect'}
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="h-3.5 w-3.5" />
                {message.prospect?.company_name || 'Unknown Company'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChannelBadge channel={message.channel} />
            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Approved
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {message.subject && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-500">Subject: </span>
                <span className="text-gray-900">{message.subject}</span>
              </div>
              <CopyButton text={message.subject} label="Copy Subject" />
            </div>
          </div>
        )}

        <div className={clsx('relative', !isExpanded && message.content.length > 300 && 'max-h-32 overflow-hidden')}>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{message.content}</p>
          {!isExpanded && message.content.length > 300 && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {message.content.length > 300 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CopyButton text={message.content} label="Copy Message" />

          <div className="flex flex-wrap items-center gap-2">
            {message.channel === 'email' && gmailUrl && (
              <a
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Open in Gmail
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {(message.channel === 'linkedin' || message.channel === 'inmail') && (
              <>
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {salesNavUrl && (
                  <a
                    href={salesNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0073b1] text-white rounded-lg hover:bg-[#006097] transition-colors"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Sales Navigator
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </>
            )}

            <button
              onClick={() => onMarkSent(message.id)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Mark as Sent
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Approved() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = parseInt(searchParams.get('page') || '1')
  const channel = searchParams.get('channel') || ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['approvedMessages', page, channel],
    queryFn: () => messages.list({
      status: 'approved',
      channel: channel || undefined,
      page,
      per_page: 10,
    }).then(res => res.data),
  })

  const markSentMutation = useMutation({
    mutationFn: (id) => messages.markSent(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['approvedMessages'])
    },
  })

  const handleMarkAllSent = async () => {
    if (!data?.messages?.length) return
    if (!window.confirm(`Mark all ${data.messages.length} messages as sent?`)) return

    for (const msg of data.messages) {
      await markSentMutation.mutateAsync(msg.id)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approved Messages</h1>
          <p className="text-gray-500 mt-1">
            {data?.total || 0} messages ready to send
          </p>
        </div>
        {data?.messages?.length > 0 && (
          <button
            onClick={handleMarkAllSent}
            disabled={markSentMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Mark All Sent ({data.messages.length})
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email Messages</p>
              <p className="text-xl font-bold text-gray-900">
                {data?.messages?.filter(m => m.channel === 'email').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Linkedin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">LinkedIn Messages</p>
              <p className="text-xl font-bold text-gray-900">
                {data?.messages?.filter(m => m.channel === 'linkedin' || m.channel === 'inmail').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Send className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ready to Send</p>
              <p className="text-xl font-bold text-gray-900">{data?.total || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={channel}
            onChange={(e) => setSearchParams({ channel: e.target.value, page: '1' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Channels</option>
            <option value="email">Email</option>
            <option value="linkedin">LinkedIn</option>
            <option value="inmail">InMail</option>
          </select>
        </div>
      </div>

      {/* Message List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load approved messages</p>
          <button
            onClick={() => queryClient.invalidateQueries(['approvedMessages'])}
            className="mt-4 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : data?.messages?.length > 0 ? (
        <div className="space-y-4">
          {data.messages.map((message) => (
            <ApprovedMessageCard
              key={message.id}
              message={message}
              onMarkSent={markSentMutation.mutate}
            />
          ))}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {data.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchParams({ channel, page: String(page - 1) })}
                  disabled={page === 1}
                  className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSearchParams({ channel, page: String(page + 1) })}
                  disabled={page === data.pages}
                  className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No approved messages</h2>
          <p className="text-gray-500 mb-6">
            Approve messages from the review queue to see them here
          </p>
          <Link
            to="/review"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Review Queue
          </Link>
        </div>
      )}
    </div>
  )
}
