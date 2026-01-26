import React, { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle, X,
  Download, Users, ArrowRight, Loader2, FileText
} from 'lucide-react'
import { prospects } from '../api/client'
import clsx from 'clsx'

const EXPECTED_COLUMNS = [
  { name: 'first_name', required: true, description: 'First name of the prospect' },
  { name: 'last_name', required: true, description: 'Last name of the prospect' },
  { name: 'email', required: false, description: 'Email address' },
  { name: 'title', required: false, description: 'Job title' },
  { name: 'company_name', required: false, description: 'Company name' },
  { name: 'linkedin_url', required: false, description: 'LinkedIn profile URL' },
  { name: 'phone', required: false, description: 'Phone number' },
  { name: 'location', required: false, description: 'Location (city, country)' },
  { name: 'company_website', required: false, description: 'Company website URL' },
  { name: 'company_industry', required: false, description: 'Company industry' },
  { name: 'company_size', required: false, description: 'Number of employees' },
]

const SAMPLE_CSV = `first_name,last_name,email,title,company_name,linkedin_url,phone,location
John,Doe,john@example.com,CTO,Acme Inc,https://linkedin.com/in/johndoe,+1234567890,San Francisco
Jane,Smith,jane@techcorp.io,VP Engineering,TechCorp,https://linkedin.com/in/janesmith,,New York
Mike,Johnson,mike@startup.com,Head of Security,StartupXYZ,,,Austin`

function DropZone({ onFileSelect, isDragging, setIsDragging }) {
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [setIsDragging])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [setIsDragging])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      onFileSelect(file)
    }
  }, [onFileSelect, setIsDragging])

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      )}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
        id="file-input"
      />

      <div className="flex flex-col items-center">
        <div className={clsx(
          'p-4 rounded-full mb-4 transition-colors',
          isDragging ? 'bg-blue-100' : 'bg-gray-100'
        )}>
          <Upload className={clsx(
            'h-8 w-8',
            isDragging ? 'text-blue-600' : 'text-gray-400'
          )} />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isDragging ? 'Drop your file here' : 'Upload CSV File'}
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop your CSV file here, or click to browse
        </p>

        <label
          htmlFor="file-input"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
        >
          <FileSpreadsheet className="h-5 w-5" />
          Select CSV File
        </label>

        <p className="text-xs text-gray-400 mt-4">
          Maximum file size: 10MB
        </p>
      </div>
    </div>
  )
}

function FilePreview({ file, onRemove, preview }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {preview && (
        <div className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {preview.headers.map((header, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {preview.totalRows} total rows detected
          </p>
        </div>
      )}
    </div>
  )
}

function ImportResult({ result, onReset }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Successful!</h2>
      <p className="text-gray-500 mb-6">
        Your prospects have been imported and are ready for outreach
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-3xl font-bold text-green-600">{result.imported || 0}</p>
          <p className="text-sm text-green-700">Imported</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-3xl font-bold text-yellow-600">{result.duplicates || 0}</p>
          <p className="text-sm text-yellow-700">Duplicates Skipped</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-3xl font-bold text-red-600">{result.errors || 0}</p>
          <p className="text-sm text-red-700">Errors</p>
        </div>
      </div>

      {result.error_details?.length > 0 && (
        <div className="mb-6 text-left">
          <p className="text-sm font-medium text-gray-700 mb-2">Error Details:</p>
          <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
            {result.error_details.map((error, i) => (
              <p key={i} className="text-sm text-red-700">
                Row {error.row}: {error.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Import More
        </button>
        <button
          onClick={() => navigate('/prospects')}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Prospects
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function Import() {
  const queryClient = useQueryClient()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const importMutation = useMutation({
    mutationFn: (file) => prospects.importCSV(file),
    onSuccess: (response) => {
      setImportResult(response.data)
      queryClient.invalidateQueries(['prospects'])
    },
  })

  const parseCSVPreview = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const rows = lines.slice(1, 6).map(line => {
        const values = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())
        return values
      })

      setPreview({
        headers,
        rows,
        totalRows: lines.length - 1,
      })
    }
    reader.readAsText(file)
  }, [])

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile)
    parseCSVPreview(selectedFile)
    setImportResult(null)
  }, [parseCSVPreview])

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
  }

  const handleImport = () => {
    if (file) {
      importMutation.mutate(file)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setImportResult(null)
    importMutation.reset()
  }

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_prospects.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (importResult) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Import Prospects</h1>
          <p className="text-gray-500 mt-1">Upload a CSV file to add prospects</p>
        </div>
        <ImportResult result={importResult} onReset={handleReset} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Prospects</h1>
          <p className="text-gray-500 mt-1">Upload a CSV file to add prospects</p>
        </div>
        <button
          onClick={downloadSampleCSV}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Sample CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {!file ? (
            <DropZone
              onFileSelect={handleFileSelect}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
            />
          ) : (
            <>
              <FilePreview
                file={file}
                onRemove={handleRemoveFile}
                preview={preview}
              />

              {importMutation.isError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Import Failed</p>
                    <p className="text-sm text-red-700">
                      {importMutation.error?.response?.data?.detail || 'An error occurred during import'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleRemoveFile}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      Import {preview?.totalRows || 0} Prospects
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Column Reference */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              CSV Column Reference
            </h3>
            <div className="space-y-3">
              {EXPECTED_COLUMNS.map((col) => (
                <div key={col.name} className="flex items-start gap-2">
                  <span className={clsx(
                    'px-1.5 py-0.5 text-xs rounded font-mono',
                    col.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  )}>
                    {col.name}
                  </span>
                  {col.required && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              <span className="text-red-500">*</span> Required fields
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for Import</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Use the first row for column headers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>LinkedIn URLs help with research and scoring</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Duplicates are detected by email or LinkedIn URL</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Maximum 1,000 prospects per import</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
