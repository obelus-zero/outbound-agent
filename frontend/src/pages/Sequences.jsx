import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Plus, Trash2, GripVertical, Linkedin, Mail, Phone, MessageSquare, Clock } from "lucide-react"
import { sequences } from "../api/client"

const STEP_TYPES = [
  { value: "linkedin_connection", label: "LinkedIn Connection", icon: Linkedin, color: "blue" },
  { value: "cold_email", label: "Cold Email", icon: Mail, color: "green" },
  { value: "linkedin_inmail", label: "LinkedIn InMail", icon: MessageSquare, color: "blue" },
  { value: "cold_call", label: "Cold Call", icon: Phone, color: "purple" },
  { value: "voicemail", label: "Voicemail", icon: Phone, color: "purple" },
  { value: "follow_up_email", label: "Follow-up Email", icon: Mail, color: "green" },
]

export default function Sequences() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSequence, setNewSequence] = useState({ name: "", description: "", steps: [] })
  const queryClient = useQueryClient()

  const { data: sequencesList, isLoading } = useQuery({
    queryKey: ["sequences"],
    queryFn: () => sequences.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => sequences.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["sequences"])
      setShowCreateModal(false)
      setNewSequence({ name: "", description: "", steps: [] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => sequences.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["sequences"]),
  })

  const addStep = (stepType) => {
    const stepInfo = STEP_TYPES.find(s => s.value === stepType)
    setNewSequence(prev => ({
      ...prev,
      steps: [...prev.steps, {
        order: prev.steps.length + 1,
        step_type: stepType,
        name: stepInfo?.label || stepType,
        delay_days: prev.steps.length === 0 ? 0 : 2,
        delay_hours: 0,
      }]
    }))
  }

  const removeStep = (index) => {
    setNewSequence(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    }))
  }

  const updateStepDelay = (index, days) => {
    setNewSequence(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? { ...s, delay_days: parseInt(days) || 0 } : s)
    }))
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sequences</h1>
          <p className="mt-1 text-sm text-gray-500">Create multi-step outreach sequences</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Sequence
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
      ) : sequencesList?.length > 0 ? (
        <div className="grid gap-4">
          {sequencesList.map(seq => (
            <div key={seq.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{seq.name}</h3>
                  <p className="text-sm text-gray-500">{seq.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100">{seq.steps?.length || 0} steps</span>
                  <button onClick={() => { if (confirm("Delete this sequence?")) deleteMutation.mutate(seq.id) }} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {seq.steps?.map((step, i) => {
                  const stepInfo = STEP_TYPES.find(s => s.value === step.step_type)
                  const Icon = stepInfo?.icon || Mail
                  return (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-gray-400 text-xs">{step.delay_days}d</span>}
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                        <Icon className="h-3 w-3" />
                        {step.name}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p>No sequences created yet</p>
          <button onClick={() => setShowCreateModal(true)} className="text-blue-600 text-sm mt-2">Create your first sequence</button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Sequence</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={newSequence.name} onChange={e => setNewSequence(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Standard Outreach" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={newSequence.description} onChange={e => setNewSequence(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Optional description" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Steps</label>
              <div className="space-y-2 mb-4">
                {newSequence.steps.map((step, i) => {
                  const stepInfo = STEP_TYPES.find(s => s.value === step.step_type)
                  const Icon = stepInfo?.icon || Mail
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium w-6">{step.order}.</span>
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{step.name}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <input type="number" value={step.delay_days} onChange={e => updateStepDelay(i, e.target.value)} className="w-12 px-1 py-0.5 text-sm border border-gray-300 rounded" min="0" />
                        <span className="text-xs text-gray-500">days</span>
                      </div>
                      <button onClick={() => removeStep(i)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {STEP_TYPES.map(type => (
                  <button key={type.value} onClick={() => addStep(type.value)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    <type.icon className="h-3 w-3" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button onClick={() => { setShowCreateModal(false); setNewSequence({ name: "", description: "", steps: [] }) }} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={() => createMutation.mutate(newSequence)} disabled={!newSequence.name || newSequence.steps.length === 0 || createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {createMutation.isPending ? "Creating..." : "Create Sequence"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
