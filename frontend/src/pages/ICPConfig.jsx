import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Save, Copy, Star, StarOff, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Target, Building2, Briefcase, TrendingUp,
  AlertTriangle, MessageSquare, X
} from 'lucide-react'
import { icp } from '../api/client'
import clsx from 'clsx'

const EMPTY_ICP = {
  name: '',
  description: '',
  target_industries: [],
  target_titles: [],
  target_seniority_levels: [],
  company_size_min: null,
  company_size_max: null,
  target_regions: [],
  revenue_range_min: null,
  revenue_range_max: null,
  technology_stack: [],
  buying_signals: [],
  pain_points: [],
  value_propositions: [],
  disqualifiers: [],
  scoring_weights: {
    industry: 20,
    title: 25,
    seniority: 15,
    company_size: 15,
    signals: 25,
  },
}

function TagInput({ value = [], onChange, placeholder, className }) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed])
      }
      setInputValue('')
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className={clsx('border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent', className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm py-1"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add</p>
    </div>
  )
}

function ICPForm({ icpData, onSave, onCancel, isNew = false }) {
  const [formData, setFormData] = useState(icpData || EMPTY_ICP)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFormData(icpData || EMPTY_ICP)
  }, [icpData])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleWeightChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      scoring_weights: {
        ...prev.scoring_weights,
        [field]: parseInt(value) || 0,
      },
    }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required'
    }
    if (formData.target_industries?.length === 0) {
      newErrors.target_industries = 'At least one industry is required'
    }
    if (formData.target_titles?.length === 0) {
      newErrors.target_titles = 'At least one title is required'
    }

    // Validate weight sum
    const weightSum = Object.values(formData.scoring_weights || {}).reduce((a, b) => a + b, 0)
    if (weightSum !== 100) {
      newErrors.scoring_weights = `Weights must sum to 100 (currently ${weightSum})`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSave(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ICP Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Enterprise Security Teams"
              className={clsx(
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500',
                errors.name ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your ideal customer profile..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Target Criteria */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Target Criteria
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Industries *
            </label>
            <TagInput
              value={formData.target_industries || []}
              onChange={(v) => handleChange('target_industries', v)}
              placeholder="Add industries (e.g., FinTech, Healthcare, SaaS)"
              className={errors.target_industries ? 'border-red-500' : ''}
            />
            {errors.target_industries && <p className="text-red-500 text-sm mt-1">{errors.target_industries}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Job Titles *
            </label>
            <TagInput
              value={formData.target_titles || []}
              onChange={(v) => handleChange('target_titles', v)}
              placeholder="Add titles (e.g., CTO, VP Engineering, Security Lead)"
              className={errors.target_titles ? 'border-red-500' : ''}
            />
            {errors.target_titles && <p className="text-red-500 text-sm mt-1">{errors.target_titles}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seniority Levels
            </label>
            <TagInput
              value={formData.target_seniority_levels || []}
              onChange={(v) => handleChange('target_seniority_levels', v)}
              placeholder="Add seniority levels (e.g., C-Level, VP, Director)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Size (Min Employees)
              </label>
              <input
                type="number"
                value={formData.company_size_min || ''}
                onChange={(e) => handleChange('company_size_min', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Size (Max Employees)
              </label>
              <input
                type="number"
                value={formData.company_size_max || ''}
                onChange={(e) => handleChange('company_size_max', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Regions
            </label>
            <TagInput
              value={formData.target_regions || []}
              onChange={(v) => handleChange('target_regions', v)}
              placeholder="Add regions (e.g., North America, EMEA, APAC)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technology Stack
            </label>
            <TagInput
              value={formData.technology_stack || []}
              onChange={(v) => handleChange('technology_stack', v)}
              placeholder="Add technologies (e.g., AWS, Kubernetes, Python)"
            />
          </div>
        </div>
      </div>

      {/* Signals & Pain Points */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Buying Signals & Pain Points
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buying Signals
            </label>
            <TagInput
              value={formData.buying_signals || []}
              onChange={(v) => handleChange('buying_signals', v)}
              placeholder="Add signals (e.g., Recent funding, Hiring engineers, New leadership)"
            />
            <p className="text-xs text-gray-500 mt-1">Events that indicate buying intent</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pain Points
            </label>
            <TagInput
              value={formData.pain_points || []}
              onChange={(v) => handleChange('pain_points', v)}
              placeholder="Add pain points (e.g., Security vulnerabilities, Slow deployments)"
            />
            <p className="text-xs text-gray-500 mt-1">Common challenges your solution addresses</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value Propositions
            </label>
            <TagInput
              value={formData.value_propositions || []}
              onChange={(v) => handleChange('value_propositions', v)}
              placeholder="Add value props (e.g., 10x faster deployments, 50% fewer bugs)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disqualifiers
            </label>
            <TagInput
              value={formData.disqualifiers || []}
              onChange={(v) => handleChange('disqualifiers', v)}
              placeholder="Add disqualifiers (e.g., Too small, Competitor customer)"
            />
            <p className="text-xs text-gray-500 mt-1">Criteria that disqualify a prospect</p>
          </div>
        </div>
      </div>

      {/* Scoring Weights */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-lg font-semibold text-gray-900"
        >
          <span className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Scoring Weights
          </span>
          {showAdvanced ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-500">
              Adjust how much each criterion contributes to the ICP score. Weights must sum to 100.
            </p>

            {errors.scoring_weights && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {errors.scoring_weights}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { key: 'industry', label: 'Industry' },
                { key: 'title', label: 'Job Title' },
                { key: 'seniority', label: 'Seniority' },
                { key: 'company_size', label: 'Company Size' },
                { key: 'signals', label: 'Buying Signals' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.scoring_weights?.[key] || 0}
                      onChange={(e) => handleWeightChange(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Weight</span>
              <span className={clsx(
                'font-bold',
                Object.values(formData.scoring_weights || {}).reduce((a, b) => a + b, 0) === 100
                  ? 'text-green-600'
                  : 'text-red-600'
              )}>
                {Object.values(formData.scoring_weights || {}).reduce((a, b) => a + b, 0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isNew ? 'Create ICP' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

function ICPCard({ icpItem, onEdit, onDelete, onSetDefault, onDuplicate, isActive }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={clsx(
      'bg-white rounded-lg shadow-sm border-2 overflow-hidden',
      isActive ? 'border-blue-500' : 'border-transparent'
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{icpItem.name}</h3>
              {isActive && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Default
                </span>
              )}
            </div>
            {icpItem.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{icpItem.description}</p>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {icpItem.target_industries?.slice(0, 3).map((ind, i) => (
            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {ind}
            </span>
          ))}
          {(icpItem.target_industries?.length || 0) > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
              +{icpItem.target_industries.length - 3} more
            </span>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {icpItem.target_titles?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Target Titles</p>
                <div className="flex flex-wrap gap-1">
                  {icpItem.target_titles.map((title, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {icpItem.pain_points?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pain Points</p>
                <div className="flex flex-wrap gap-1">
                  {icpItem.pain_points.map((point, i) => (
                    <span key={i} className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {icpItem.buying_signals?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Buying Signals</p>
                <div className="flex flex-wrap gap-1">
                  {icpItem.buying_signals.map((signal, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetDefault(icpItem.id)}
            disabled={isActive}
            className={clsx(
              'p-1.5 rounded transition-colors',
              isActive
                ? 'text-yellow-500 cursor-default'
                : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
            )}
            title={isActive ? 'Currently default' : 'Set as default'}
          >
            {isActive ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onDuplicate(icpItem.id)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(icpItem)}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(icpItem.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ICPConfig() {
  const queryClient = useQueryClient()
  const [editingICP, setEditingICP] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  const { data: icpList, isLoading, error } = useQuery({
    queryKey: ['icpList'],
    queryFn: () => icp.list().then(res => res.data),
  })

  const { data: activeICP } = useQuery({
    queryKey: ['activeICP'],
    queryFn: () => icp.getActive().then(res => res.data).catch(() => null),
  })

  const createMutation = useMutation({
    mutationFn: (data) => icp.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['icpList'])
      queryClient.invalidateQueries(['activeICP'])
      setIsCreating(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => icp.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['icpList'])
      queryClient.invalidateQueries(['activeICP'])
      setEditingICP(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => icp.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['icpList'])
      queryClient.invalidateQueries(['activeICP'])
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id) => icp.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['icpList'])
      queryClient.invalidateQueries(['activeICP'])
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: (id) => icp.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['icpList'])
    },
  })

  const handleSave = (data) => {
    if (editingICP?.id) {
      updateMutation.mutate({ id: editingICP.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this ICP? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  if (isCreating || editingICP) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingICP ? 'Edit ICP' : 'Create New ICP'}
          </h1>
          <p className="text-gray-500 mt-1">
            {editingICP ? 'Update your ideal customer profile' : 'Define a new ideal customer profile'}
          </p>
        </div>

        <ICPForm
          icpData={editingICP}
          onSave={handleSave}
          onCancel={() => {
            setEditingICP(null)
            setIsCreating(false)
          }}
          isNew={!editingICP}
        />

        {(createMutation.isError || updateMutation.isError) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Failed to save ICP. Please try again.
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ICP Configuration</h1>
          <p className="text-gray-500 mt-1">
            Manage your ideal customer profiles
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create New ICP
        </button>
      </div>

      {/* ICP List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load ICPs</p>
          <button
            onClick={() => queryClient.invalidateQueries(['icpList'])}
            className="mt-4 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : icpList?.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {icpList.map((icpItem) => (
            <ICPCard
              key={icpItem.id}
              icpItem={icpItem}
              isActive={activeICP?.id === icpItem.id}
              onEdit={setEditingICP}
              onDelete={handleDelete}
              onSetDefault={setDefaultMutation.mutate}
              onDuplicate={duplicateMutation.mutate}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No ICPs configured</h2>
          <p className="text-gray-500 mb-6">
            Create your first ideal customer profile to start scoring prospects
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First ICP
          </button>
        </div>
      )}
    </div>
  )
}
