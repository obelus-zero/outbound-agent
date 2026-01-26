import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CheckCircle, XCircle, RefreshCw, Edit2, Save, X, ChevronLeft, ChevronRight,
  Mail, MessageSquare, Linkedin, User, Building2, AlertCircle, Filter
} from 'lucide-react'
import { messages, workflow } from '../api/client'
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

function MessageCard({ message, onApprove, onReject, onRegenerate, isProcessing }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(message.content)
  const [editedSubject, setEditedSubject] = useState(message.subject || '')
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data) => messages.update(message.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviewQueue'])
      setIsEditing(false)
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      content: editedContent,
      subject: editedSubject || null,
    })
  }

  const handleCancel = () => {
    setEditedContent(message.content)
    setEditedSubject(message.subject || '')
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
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
                <span className="text-gray-300">|</span>
                {message.prospect?.title || 'Unknown Title'}
              </div>
            </div>
          </div>
          <ChannelBadge channel={message.channel} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            {message.channel === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        ) : (
          <div>
            {message.subject && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-500">Subject: </span>
                <span className="text-gray-900">{message.subject}</span>
              </div>
            )}
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        )}

        {/* Personalization hints */}
        {message.personalization_data && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Personalization used:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(message.personalization_data).map(([key, value]) => (
                value && (
                  <span key={key} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {key}: {typeof value === 'string' ? value.substring(0, 30) + (value.length > 30 ? '...' : '') : value}
                  </span>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRegenerate(message.id)}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={clsx('h-4 w-4', isProcessing && 'animate-spin')} />
                Regenerate
              </button>
              <button
                onClick={() => onReject(message.id)}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={() => onApprove(message.id)}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReviewQueue() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [processingIds, setProcessingIds] = useState(new Set())

  const page = parseInt(searchParams.get('page') || '1')
  const channel = searchParams.get('channel') || ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewQueue', page, channel],
    queryFn: () => messages.list({
      status: 'pending',
      channel: channel || undefined,
      page,
      per_page: 10,
    }).then(res => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['workflowStats'],
    queryFn: () => workflow.getStats().then(res => res.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => messages.approve(id),
    onMutate: (id) => {
      setProcessingIds(prev => new Set([...prev, id]))
    },
    onSettled: (_, __, id) => {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      queryClient.invalidateQueries(['reviewQueue'])
      queryClient.invalidateQueries(['workflowStats'])
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => messages.reject(id),
    onMutate: (id) => {
      setProcessingIds(prev => new Set([...prev, id]))
    },
    onSettled: (_, __, id) => {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      queryClient.invalidateQueries(['reviewQueue'])
      queryClient.invalidateQueries(['workflowStats'])
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: (id) => messages.regenerate(id),
    onMutate: (id) => {
      setProcessingIds(prev => new Set([...prev, id]))
    },
    onSettled: (_, __, id) => {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      queryClient.invalidateQueries(['reviewQueue'])
    },
  })

  const handleApproveAll = async () => {
    if (!data?.messages?.length) return
    if (!window.confirm(`Are you sure you want to approve all ${data.messages.length} messages?`)) return

    for (const msg of data.messages) {
      await approveMutation.mutateAsync(msg.id)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <p className="text-gray-500 mt-1">
            {data?.total || 0} messages pending review
          </p>
        </div>
        {data?.messages?.length > 0 && (
          <button
            onClick={handleApproveAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Approve All ({data.messages.length})
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending_review || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Approved Today</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved_today || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Sent Today</p>
            <p className="text-2xl font-bold text-blue-600">{stats.sent_today || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Response Rate</p>
            <p className="text-2xl font-bold text-purple-600">{stats.response_rate || 0}%</p>
          </div>
        </div>
      )}

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
          <p className="text-gray-500">Failed to load review queue</p>
          <button
            onClick={() => queryClient.invalidateQueries(['reviewQueue'])}
            className="mt-4 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : data?.messages?.length > 0 ? (
        <div className="space-y-4">
          {data.messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onApprove={approveMutation.mutate}
              onReject={rejectMutation.mutate}
              onRegenerate={regenerateMutation.mutate}
              isProcessing={processingIds.has(message.id)}
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
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
          <p className="text-gray-500 mb-6">No messages pending review</p>
          <Link
            to="/prospects"
            className="text-blue-600 hover:underline"
          >
            View prospects to generate more messages
          </Link>
        </div>
      )}
    </div>
  )
}
