import React, { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Linkedin, Mail, Phone, Building2, MapPin, Globe,
  ExternalLink, GripVertical, Plus, Trash2, Clock, MessageSquare,
  CheckCircle, AlertCircle, User, Briefcase, TrendingUp
} from 'lucide-react'
import { prospects, sequences, messages } from '../api/client'
import clsx from 'clsx'

const STEP_TYPES = [
  { id: 'linkedin_connection', label: 'LinkedIn Connection', icon: Linkedin, color: 'bg-blue-500' },
  { id: 'linkedin_inmail', label: 'InMail', icon: MessageSquare, color: 'bg-blue-600' },
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-green-500' },
  { id: 'phone', label: 'Phone Call', icon: Phone, color: 'bg-purple-500' },
  { id: 'wait', label: 'Wait', icon: Clock, color: 'bg-gray-500' },
]

function ScoreBadge({ score, size = 'md' }) {
  const color = score >= 80 ? 'bg-green-100 text-green-800 border-green-200'
    : score >= 50 ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : score >= 25 ? 'bg-orange-100 text-orange-800 border-orange-200'
    : 'bg-gray-100 text-gray-600 border-gray-200'

  const sizeClasses = size === 'lg' ? 'text-2xl px-4 py-2' : 'text-sm px-3 py-1'

  return (
    <span className={clsx('rounded-full font-bold border', color, sizeClasses)}>
      {score}
    </span>
  )
}

function StatusBadge({ status }) {
  const colors = {
    new: 'bg-gray-100 text-gray-700',
    researching: 'bg-blue-100 text-blue-700',
    ready_for_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    contacted: 'bg-purple-100 text-purple-700',
    responded: 'bg-indigo-100 text-indigo-700',
    meeting_booked: 'bg-pink-100 text-pink-700',
    converted: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-red-100 text-red-700',
  }
  return (
    <span className={clsx('px-3 py-1 rounded-full text-sm font-medium capitalize', colors[status] || 'bg-gray-100')}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

function DraggableStep({ step, index, onDelete, onUpdate, isDragging, onDragStart, onDragEnd, onDragOver }) {
  const stepType = STEP_TYPES.find(t => t.id === step.step_type) || STEP_TYPES[0]
  const Icon = stepType.icon

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      className={clsx(
        'flex items-center gap-3 p-4 bg-white border rounded-lg cursor-move transition-all',
        isDragging ? 'opacity-50 border-blue-400 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
      <div className={clsx('p-2 rounded-lg', stepType.color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{stepType.label}</p>
        {step.step_type === 'wait' ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              min="1"
              value={step.wait_days || 1}
              onChange={(e) => onUpdate(step.id, { wait_days: parseInt(e.target.value) || 1 })}
              className="w-16 px-2 py-1 text-sm border rounded"
            />
            <span className="text-sm text-gray-500">days</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 truncate">
            {step.status === 'completed' ? 'Completed' : step.status === 'skipped' ? 'Skipped' : 'Pending'}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {step.status === 'completed' && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
        <button
          onClick={() => onDelete(step.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SequenceBuilder({ prospectId, sequence, refetch }) {
  const queryClient = useQueryClient()
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showAddStep, setShowAddStep] = useState(false)

  const addStepMutation = useMutation({
    mutationFn: (step) => sequences.addStep(sequence?.id, step),
    onSuccess: () => {
      queryClient.invalidateQueries(['sequence', prospectId])
      refetch()
      setShowAddStep(false)
    },
  })

  const deleteStepMutation = useMutation({
    mutationFn: (stepId) => sequences.deleteStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries(['sequence', prospectId])
      refetch()
    },
  })

  const updateStepMutation = useMutation({
    mutationFn: ({ stepId, data }) => sequences.updateStep(stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sequence', prospectId])
      refetch()
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (stepIds) => sequences.reorderSteps(sequence?.id, stepIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['sequence', prospectId])
      refetch()
    },
  })

  const createSequenceMutation = useMutation({
    mutationFn: () => sequences.create({ prospect_id: prospectId, name: 'Outreach Sequence' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['sequence', prospectId])
      refetch()
    },
  })

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const steps = [...(sequence?.steps || [])]
    const [draggedItem] = steps.splice(draggedIndex, 1)
    steps.splice(index, 0, draggedItem)

    // Optimistically update UI
    setDraggedIndex(index)
  }, [draggedIndex, sequence?.steps])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    if (draggedIndex === null || !sequence?.steps) return

    const stepIds = sequence.steps.map(s => s.id)
    reorderMutation.mutate(stepIds)
    setDraggedIndex(null)
  }, [draggedIndex, sequence?.steps, reorderMutation])

  const handleAddStep = (stepType) => {
    addStepMutation.mutate({
      step_type: stepType,
      order_index: (sequence?.steps?.length || 0) + 1,
      wait_days: stepType === 'wait' ? 3 : null,
    })
  }

  const handleDeleteStep = (stepId) => {
    if (window.confirm('Are you sure you want to delete this step?')) {
      deleteStepMutation.mutate(stepId)
    }
  }

  const handleUpdateStep = (stepId, data) => {
    updateStepMutation.mutate({ stepId, data })
  }

  if (!sequence) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No sequence created yet</p>
        <button
          onClick={() => createSequenceMutation.mutate()}
          disabled={createSequenceMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {createSequenceMutation.isPending ? 'Creating...' : 'Create Sequence'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="space-y-3"
      >
        {sequence.steps?.length > 0 ? (
          sequence.steps.map((step, index) => (
            <DraggableStep
              key={step.id}
              step={step}
              index={index}
              isDragging={draggedIndex === index}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDelete={handleDeleteStep}
              onUpdate={handleUpdateStep}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">No steps added yet</p>
        )}
      </div>

      {showAddStep ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Add a step:</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STEP_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleAddStep(type.id)}
                disabled={addStepMutation.isPending}
                className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className={clsx('p-2 rounded-lg', type.color)}>
                  <type.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs text-gray-700">{type.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddStep(false)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddStep(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Step
        </button>
      )}
    </div>
  )
}

function ResearchSection({ research }) {
  if (!research) {
    return (
      <div className="text-center py-6 text-gray-500">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p>No research data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {research.summary && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Summary</h4>
          <p className="text-gray-700">{research.summary}</p>
        </div>
      )}

      {research.pain_points?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Pain Points</h4>
          <ul className="list-disc list-inside space-y-1">
            {research.pain_points.map((point, i) => (
              <li key={i} className="text-gray-700">{point}</li>
            ))}
          </ul>
        </div>
      )}

      {research.talking_points?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Talking Points</h4>
          <ul className="list-disc list-inside space-y-1">
            {research.talking_points.map((point, i) => (
              <li key={i} className="text-gray-700">{point}</li>
            ))}
          </ul>
        </div>
      )}

      {research.recent_activity?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Activity</h4>
          <ul className="space-y-2">
            {research.recent_activity.map((activity, i) => (
              <li key={i} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                {activity}
              </li>
            ))}
          </ul>
        </div>
      )}

      {research.company_info && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Company Info</h4>
          <div className="bg-gray-50 p-3 rounded space-y-2">
            {research.company_info.industry && (
              <p className="text-sm"><span className="font-medium">Industry:</span> {research.company_info.industry}</p>
            )}
            {research.company_info.size && (
              <p className="text-sm"><span className="font-medium">Size:</span> {research.company_info.size}</p>
            )}
            {research.company_info.funding && (
              <p className="text-sm"><span className="font-medium">Funding:</span> {research.company_info.funding}</p>
            )}
            {research.company_info.description && (
              <p className="text-sm text-gray-600">{research.company_info.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MessageHistory({ prospectId }) {
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', prospectId],
    queryFn: () => messages.getForProspect(prospectId).then(res => res.data),
  })

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>
  }

  if (!messagesData?.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Mail className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p>No messages generated yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {messagesData.map((msg) => (
        <div key={msg.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={clsx(
              'px-2 py-1 text-xs rounded-full font-medium capitalize',
              msg.channel === 'email' ? 'bg-green-100 text-green-700' :
              msg.channel === 'linkedin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            )}>
              {msg.channel}
            </span>
            <span className={clsx(
              'px-2 py-1 text-xs rounded-full font-medium capitalize',
              msg.status === 'approved' ? 'bg-green-100 text-green-700' :
              msg.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              msg.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            )}>
              {msg.status}
            </span>
          </div>
          {msg.subject && (
            <p className="font-medium text-gray-900 mb-1">{msg.subject}</p>
          )}
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.content}</p>
        </div>
      ))}
    </div>
  )
}

export default function ProspectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: prospect, isLoading, error, refetch } = useQuery({
    queryKey: ['prospect', id],
    queryFn: () => prospects.get(id).then(res => res.data),
  })

  const { data: sequence, refetch: refetchSequence } = useQuery({
    queryKey: ['sequence', id],
    queryFn: () => sequences.getForProspect(id).then(res => res.data).catch(() => null),
    enabled: !!id,
  })

  const generateMessageMutation = useMutation({
    mutationFn: (data) => messages.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', id])
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !prospect) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Prospect not found</h2>
        <button
          onClick={() => navigate('/prospects')}
          className="text-blue-600 hover:underline"
        >
          Back to prospects
        </button>
      </div>
    )
  }

  const salesNavUrl = prospect.linkedin_url
    ? `https://www.linkedin.com/sales/people/${prospect.linkedin_url.split('/in/')[1]?.replace('/', '')}`
    : null

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/prospects')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prospects
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {prospect.full_name?.[0] || 'P'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{prospect.full_name}</h1>
              <p className="text-gray-600">{prospect.title}</p>
              <p className="text-gray-500">{prospect.company_name}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ScoreBadge score={prospect.icp_score || 0} size="lg" />
            <StatusBadge status={prospect.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info & Research */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prospect.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline">
                      {prospect.email}
                    </a>
                  </div>
                </div>
              )}
              {prospect.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href={`tel:${prospect.phone}`} className="text-blue-600 hover:underline">
                      {prospect.phone}
                    </a>
                  </div>
                </div>
              )}
              {prospect.company_name && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="text-gray-900">{prospect.company_name}</p>
                  </div>
                </div>
              )}
              {prospect.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900">{prospect.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* External Links */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-3">External Links</h3>
              <div className="flex flex-wrap gap-3">
                {prospect.linkedin_url && (
                  <a
                    href={prospect.linkedin_url}
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
                {prospect.company_website && (
                  <a
                    href={prospect.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    Company Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Research Data */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Research Data</h2>
            <ResearchSection research={prospect.research_data} />
          </div>

          {/* Message History */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <button
                onClick={() => generateMessageMutation.mutate({
                  prospect_id: parseInt(id),
                  channel: 'email'
                })}
                disabled={generateMessageMutation.isPending}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generateMessageMutation.isPending ? 'Generating...' : 'Generate Message'}
              </button>
            </div>
            <MessageHistory prospectId={id} />
          </div>
        </div>

        {/* Right Column - Sequence Builder */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Outreach Sequence</h2>
            <SequenceBuilder
              prospectId={id}
              sequence={sequence}
              refetch={refetchSequence}
            />
          </div>

          {/* ICP Match Details */}
          {prospect.icp_match_details && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ICP Match Details</h2>
              <div className="space-y-3">
                {Object.entries(prospect.icp_match_details).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={clsx(
                      'px-2 py-1 text-xs rounded-full font-medium',
                      value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {value ? 'Match' : 'No Match'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {prospect.email && (
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(prospect.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Open in Gmail
                </a>
              )}
              {prospect.linkedin_url && (
                <a
                  href={`${prospect.linkedin_url}/overlay/send-inmail/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send InMail
                </a>
              )}
              <Link
                to="/review"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Review Messages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
