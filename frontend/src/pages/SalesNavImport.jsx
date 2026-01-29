import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, CheckCircle, AlertCircle, Linkedin, ClipboardPaste, Plus, Trash2, Edit2, ArrowRight } from 'lucide-react'
import { prospects as prospectsApi } from '../api/client'

export default function SalesNavImport() {
  const [mode, setMode] = useState('choose')
  const [pasteData, setPasteData] = useState('')
  const [parsedProspects, setParsedProspects] = useState([])
  const [manualProspects, setManualProspects] = useState([{ full_name: '', title: '', company_name: '', linkedin_url: '' }])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const parsePastedData = (text) => {
    const lines = text.trim().split('\n').filter(line => line.trim())
    const prospects = []
    let currentProspect = {}
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.match(/^(Save|Message|More|Select|Showing|\d+ of \d+|Page|Previous|Next)$/i)) continue
      if (line.match(/^(1st|2nd|3rd|\d+th)$/)) continue
      if (line.match(/^(degree connection|shared connections?)$/i)) continue
      if (line.includes('linkedin.com/in/') || line.includes('linkedin.com/sales/')) {
        currentProspect.linkedin_url = line.startsWith('http') ? line : 'https://' + line
        continue
      }
      if (line.match(/^at /i)) {
        currentProspect.company_name = line.replace(/^at /i, '').trim()
        continue
      }
      if (currentProspect.full_name && !currentProspect.title &&
          (line.match(/(director|manager|engineer|vp|cto|ceo|head|lead|chief|president|founder|developer|analyst)/i) ||
           line.match(/(security|software|product|sales|marketing|operations|finance|data|cloud|devops)/i))) {
        currentProspect.title = line
        continue
      }
      if (line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/) && !line.includes('@') && line.split(' ').length <= 5) {
        if (currentProspect.full_name) prospects.push({ ...currentProspect })
        currentProspect = { full_name: line }
        continue
      }
      if (currentProspect.full_name && currentProspect.title && !currentProspect.company_name) {
        if (!line.match(/^\d/) && line.length > 2 && line.length < 100) currentProspect.company_name = line
      }
    }
    if (currentProspect.full_name) prospects.push(currentProspect)
    return prospects
  }

  const handlePasteChange = (text) => {
    setPasteData(text)
    setParsedProspects(text.trim() ? parsePastedData(text) : [])
  }

  const addManualProspect = () => setManualProspects([...manualProspects, { full_name: '', title: '', company_name: '', linkedin_url: '' }])
  const updateManualProspect = (i, field, value) => { const u = [...manualProspects]; u[i][field] = value; setManualProspects(u) }
  const removeManualProspect = (i) => manualProspects.length > 1 && setManualProspects(manualProspects.filter((_, idx) => idx !== i))

  const handleImport = async (list) => {
    setImporting(true); setError(null)
    try {
      let imported = 0, failed = 0
      for (const p of list) {
        if (!p.full_name) continue
        try {
          let url = p.linkedin_url || 'https://www.linkedin.com/in/' + p.full_name.toLowerCase().split(' ').join('-')
          await prospectsApi.create({ full_name: p.full_name, first_name: p.full_name.split(' ')[0], last_name: p.full_name.split(' ').slice(1).join(' '), title: p.title || null, company_name: p.company_name || null, linkedin_url: url })
          imported++
        } catch { failed++ }
      }
      setResult({ imported, failed })
      queryClient.invalidateQueries(['prospects'])
    } catch (e) { setError(e.response?.data?.detail || 'Import failed') }
    finally { setImporting(false) }
  }

  if (result) return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-8 w-8 text-green-600" /></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Import Complete!</h2>
        <p className="text-gray-600 mb-6">Imported {result.imported} prospects{result.failed > 0 && ` (${result.failed} failed)`}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => { setResult(null); setPasteData(''); setParsedProspects([]); setManualProspects([{ full_name: '', title: '', company_name: '', linkedin_url: '' }]); setMode('choose') }} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">Import More</button>
          <button onClick={() => navigate('/prospects')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Prospects <ArrowRight className="inline h-4 w-4 ml-1" /></button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold text-gray-900">Import from Sales Navigator</h1><p className="text-gray-500 mt-1">Add prospects directly from LinkedIn Sales Navigator</p></div>
      <div className="flex gap-4 mb-6">
        <a href="https://www.linkedin.com/sales/lists/people" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Linkedin className="h-4 w-4" />Open My Lists<ExternalLink className="h-3 w-3" /></a>
        <a href="https://www.linkedin.com/sales/search/people" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Linkedin className="h-4 w-4" />Open Lead Search<ExternalLink className="h-3 w-3" /></a>
      </div>

      {mode === 'choose' && (
        <div className="grid md:grid-cols-2 gap-6">
          <button onClick={() => setMode('paste')} className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md border-2 border-transparent hover:border-blue-500">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"><ClipboardPaste className="h-6 w-6 text-blue-600" /></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Copy & Paste from Sales Nav</h3>
            <p className="text-gray-600 text-sm">Select and copy prospect info directly from Sales Navigator, then paste here.</p>
            <div className="mt-4 text-blue-600 font-medium text-sm flex items-center gap-1">Quick import <ArrowRight className="h-4 w-4" /></div>
          </button>
          <button onClick={() => setMode('manual')} className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md border-2 border-transparent hover:border-blue-500">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4"><Edit2 className="h-6 w-6 text-green-600" /></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Entry</h3>
            <p className="text-gray-600 text-sm">Add prospects one by one with their LinkedIn URL, name, title, and company.</p>
            <div className="mt-4 text-green-600 font-medium text-sm flex items-center gap-1">Add manually <ArrowRight className="h-4 w-4" /></div>
          </button>
        </div>
      )}

      {mode === 'paste' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-900">Paste from Sales Navigator</h2><button onClick={() => setMode('choose')} className="text-gray-500 hover:text-gray-700">← Back</button></div>
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">How to copy from Sales Navigator:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Go to your Sales Navigator lead list or search results</li>
              <li>Select the text for the prospects you want (click and drag)</li>
              <li>Copy with Ctrl+C (or Cmd+C on Mac)</li>
              <li>Paste below</li>
            </ol>
          </div>
          <textarea value={pasteData} onChange={(e) => handlePasteChange(e.target.value)} placeholder="Paste copied text from Sales Navigator here..." className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
          {parsedProspects.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Parsed {parsedProspects.length} prospect(s):</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Title</th><th className="px-4 py-2 text-left">Company</th><th className="px-4 py-2 text-left">LinkedIn</th></tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedProspects.map((p, i) => <tr key={i}><td className="px-4 py-2">{p.full_name}</td><td className="px-4 py-2 text-gray-600">{p.title || '-'}</td><td className="px-4 py-2 text-gray-600">{p.company_name || '-'}</td><td className="px-4 py-2">{p.linkedin_url ? <a href={p.linkedin_url} target="_blank" className="text-blue-600 hover:underline">View</a> : <span className="text-gray-400">Auto</span>}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertCircle className="h-5 w-5" />{error}</div>}
          <div className="flex gap-4 mt-6">
            <button onClick={() => setMode('choose')} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={() => handleImport(parsedProspects)} disabled={parsedProspects.length === 0 || importing} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{importing ? 'Importing...' : `Import ${parsedProspects.length} Prospects`}</button>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-900">Add Prospects Manually</h2><button onClick={() => setMode('choose')} className="text-gray-500 hover:text-gray-700">← Back</button></div>
          <div className="space-y-4">
            {manualProspects.map((p, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium text-gray-700">Prospect {i + 1}</span>{manualProspects.length > 1 && <button onClick={() => removeManualProspect(i)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="h-4 w-4" /></button>}</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input type="text" placeholder="Full Name *" value={p.full_name} onChange={(e) => updateManualProspect(i, 'full_name', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Title" value={p.title} onChange={(e) => updateManualProspect(i, 'title', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Company" value={p.company_name} onChange={(e) => updateManualProspect(i, 'company_name', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="LinkedIn URL" value={p.linkedin_url} onChange={(e) => updateManualProspect(i, 'linkedin_url', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={addManualProspect} className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" />Add Another</button>
          {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertCircle className="h-5 w-5" />{error}</div>}
          <div className="flex gap-4 mt-6">
            <button onClick={() => setMode('choose')} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={() => handleImport(manualProspects.filter(p => p.full_name))} disabled={!manualProspects.some(p => p.full_name) || importing} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{importing ? 'Importing...' : `Import ${manualProspects.filter(p => p.full_name).length} Prospects`}</button>
          </div>
        </div>
      )}
    </div>
  )
}
