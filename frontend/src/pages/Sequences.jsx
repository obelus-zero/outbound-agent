import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { sequences } from '../api/client'
import clsx from 'clsx'

const stepTypeOptions = [
  { value: 'linkedin_connection', label: 'LinkedIn Connection Request', icon: '🔗' },
  { value: 'linkedin_dm', label: 'LinkedIn DM', icon: '💬' },
  { value: 'linkedin_inmail', label: 'LinkedIn InMail', icon: '📧' },
  { value: 'cold_email', label: 'Cold Email', icon: '✉️' },
  { value: 'follow_up_email', label: 'Follow-up Email', icon: '📨' },
  { value: 'cold_call', label: 'Cold Call', icon: '📞' },
  { value: 'voicemail', label: 'Voicemail', icon: '📱' },
  { value: 'wait', label: 'Wait', icon: '⏳' },
  { value: 'task', label: 'Manual Task', icon: '✅' },
]

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
}

export default function Sequences() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedSequence, setExpandedSequence] = useState(null)
  const [newSequence, setNewSequence] = useState({
    name: '',
    description: '',
    steps: [{ order: 1, step_type: 'linkedin_connection', name: 'Connection Request', delay_days: 0, delay_hours: 0, template: '', instructions: '', is_optional: false, stop_on_reply: true }]
  })

  const { data: sequencesList, isLoading, error } = useQuery({
    queryKey: ['sequences'],
    queryFn: () => sequences.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => sequences.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sequences'])
      setShowCreateForm(false)
      setNewSequence({ name: '', description: '', steps: [{ order: 1, step_type: 'linkedin_connection', name: 'Connection Request', delay_days: 0, delay_hours: 0, template: '', instructions: '', is_optional: false, stop_on_reply: true }] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => sequences.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['sequences']),
  })

  const addStep = () => {
    setNewSequence(prev => ({
      ...prev,
      steps: [...prev.steps, { order: prev.steps.length + 1, step_type: 'cold_email', name: '', delay_days: 1, delay_hours: 0, template: '', instructions: '', is_optional: false, stop_on_reply: true }]
    }))
  }

  const removeStep = (index) => {
    setNewSequence(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i + 1 }))
    }))
  }

  const updateStep = (index, field, value) => {
    setNewSequence(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === index ? { ...step, [field]: value } : step)
    }))
  }

  const handleCreate = () => {
    if (!newSequence.name.trim()) { alert('Please enter a sequence name'); return }
    if (newSequence.steps.length === 0) { alert('Please add at least one step'); return }
    createMutation.mutate(newSequence)
  }

  if (error) return <div className="p-8 text-center text-red-600">Error loading sequences: {error.message}</div>

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sequences</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage multi-step outreach sequences</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Sequence
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Sequence</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sequence Name *</label>
              <input type="text" value={newSequence.name} onChange={(e) => setNewSequence(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Enterprise Cold Outreach" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={newSequence.description} onChange={(e) => setNewSequence(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Optional description" />
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Sequence Steps</h3>
              <button onClick={addStep} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"><Plus className="h-4 w-4" /> Add Step</button>
            </div>
            <div className="space-y-3">
              {newSequence.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-gray-400 mt-2"><GripVertical className="h-5 w-5" /></div>
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Step Type</label>
                      <select value={step.step_type} onChange={(e) => updateStep(index, 'step_type', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded">
                        {stepTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                      <input type="text" value={step.name} onChange={(e) => updateStep(index, 'name', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" placeholder="Step name" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Wait Days</label>
                        <input type="number" min="0" value={step.delay_days} onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
                        <input type="number" min="0" max="23" value={step.delay_hours} onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Instructions</label>
                      <input type="text" value={step.instructions} onChange={(e) => updateStep(index, 'instructions', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" placeholder="Instructions" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <label className="flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={step.stop_on_reply} onChange={(e) => updateStep(index, 'stop_on_reply', e.target.checked)} className="rounded border-gray-300" /> Stop on reply
                    </label>
                    {newSequence.steps.length > 1 && <button onClick={() => removeStep(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={handleCreate} disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{createMutation.isPending ? 'Creating...' : 'Create Sequence'}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
        ) : sequencesList?.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {sequencesList.map((seq) => (
              <div key={seq.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setExpandedSequence(expandedSequence === seq.id ? null : seq.id)} className="text-gray-400 hover:text-gray-600">
                      {expandedSequence === seq.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <div>
                      <h3 className="font-medium text-gray-900">{seq.name}</h3>
                      <p className="text-sm text-gray-500">{seq.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={clsx('px-2 py-1 text-xs font-medium rounded-full capitalize', statusColors[seq.status])}>{seq.status}</span>
                    <span className="text-sm text-gray-500">{seq.steps?.length || 0} steps</span>
                    <button onClick={() => { if (confirm('Delete this sequence?')) deleteMutation.mutate(seq.id) }} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {expandedSequence === seq.id && seq.steps?.length > 0 && (
                  <div className="mt-4 ml-8 space-y-2">
                    {seq.steps.sort((a, b) => a.order - b.order).map((step, idx) => {
                      const stepType = stepTypeOptions.find(s => s.value === step.step_type)
                      return (
                        <div key={step.id || idx} className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400 w-6">{step.order}.</span>
                          <span className="text-lg">{stepType?.icon || '📋'}</span>
                          <span className="font-medium">{step.name || stepType?.label}</span>
                          {(step.delay_days > 0 || step.delay_hours > 0) && <span className="text-gray-500">(wait {step.delay_days > 0 ? step.delay_days + 'd' : ''}{step.delay_hours > 0 ? ' ' + step.delay_hours + 'h' : ''})</span>}
                          {step.stop_on_reply && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">stops on reply</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p>No sequences created yet</p>
            <button onClick={() => setShowCreateForm(true)} className="text-blue-600 text-sm mt-2 inline-block hover:text-blue-700">Create your first sequence →</button>
          </div>
        )}
      </div>
    </div>
  )
}
