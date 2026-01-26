import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User, Mail, Key, Bell, Link2, Shield, Save, AlertCircle,
  CheckCircle, Loader2, ExternalLink, RefreshCw
} from 'lucide-react'
import { auth, integrations } from '../api/client'
import useAuthStore from '../hooks/useAuth'
import clsx from 'clsx'

function SettingsSection({ title, description, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function ProfileSettings() {
  const { user, checkAuth } = useAuthStore()
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  })
  const [saved, setSaved] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (data) => auth.me().then(() => data), // Placeholder - implement actual update
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      checkAuth()
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  )
}

function PasswordSettings() {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (data) => new Promise(resolve => setTimeout(resolve, 1000)), // Placeholder
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setFormData({ current_password: '', new_password: '', confirm_password: '' })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required'
    }
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required'
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters'
    }
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      updateMutation.mutate(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Password
        </label>
        <input
          type="password"
          value={formData.current_password}
          onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
          className={clsx(
            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500',
            errors.current_password ? 'border-red-500' : 'border-gray-300'
          )}
        />
        {errors.current_password && (
          <p className="text-red-500 text-sm mt-1">{errors.current_password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <input
          type="password"
          value={formData.new_password}
          onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
          className={clsx(
            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500',
            errors.new_password ? 'border-red-500' : 'border-gray-300'
          )}
        />
        {errors.new_password && (
          <p className="text-red-500 text-sm mt-1">{errors.new_password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm New Password
        </label>
        <input
          type="password"
          value={formData.confirm_password}
          onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
          className={clsx(
            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500',
            errors.confirm_password ? 'border-red-500' : 'border-gray-300'
          )}
        />
        {errors.confirm_password && (
          <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Key className="h-4 w-4" />
          )}
          Update Password
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Password updated
          </span>
        )}
      </div>
    </form>
  )
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    email_new_prospects: true,
    email_messages_ready: true,
    email_responses: true,
    email_weekly_digest: false,
    browser_notifications: true,
  })

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const notifications = [
    { key: 'email_new_prospects', label: 'New prospects imported', description: 'Get notified when new prospects are added' },
    { key: 'email_messages_ready', label: 'Messages ready for review', description: 'When AI-generated messages are ready' },
    { key: 'email_responses', label: 'Prospect responses', description: 'When prospects respond to your outreach' },
    { key: 'email_weekly_digest', label: 'Weekly performance digest', description: 'Summary of your outreach performance' },
    { key: 'browser_notifications', label: 'Browser notifications', description: 'Enable desktop notifications' },
  ]

  return (
    <div className="space-y-4">
      {notifications.map(({ key, label, description }) => (
        <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div>
            <p className="font-medium text-gray-900">{label}</p>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <button
            onClick={() => handleToggle(key)}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              settings[key] ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                settings[key] ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      ))}
    </div>
  )
}

function IntegrationSettings() {
  const queryClient = useQueryClient()

  const { data: status, isLoading } = useQuery({
    queryKey: ['integrationStatus'],
    queryFn: () => integrations.getStatus().then(res => res.data),
  })

  const { data: salesforceAuthUrl } = useQuery({
    queryKey: ['salesforceAuthUrl'],
    queryFn: () => integrations.getSalesforceAuthUrl().then(res => res.data),
    enabled: !status?.salesforce?.connected,
  })

  const syncMutation = useMutation({
    mutationFn: () => integrations.syncSalesforce(),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrationStatus'])
    },
  })

  const integrationsList = [
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Sync prospects and activities with Salesforce CRM',
      icon: '☁️',
      connected: status?.salesforce?.connected,
      authUrl: salesforceAuthUrl?.url,
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Send emails directly from the platform',
      icon: '📧',
      connected: status?.gmail?.connected,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Sales Navigator',
      description: 'Research prospects and send InMails',
      icon: '💼',
      connected: status?.linkedin?.connected,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {integrationsList.map((integration) => (
        <div
          key={integration.id}
          className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{integration.icon}</span>
            <div>
              <p className="font-medium text-gray-900">{integration.name}</p>
              <p className="text-sm text-gray-500">{integration.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {integration.connected ? (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </span>
                {integration.id === 'salesforce' && (
                  <button
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Sync now"
                  >
                    <RefreshCw className={clsx('h-4 w-4', syncMutation.isPending && 'animate-spin')} />
                  </button>
                )}
              </>
            ) : integration.authUrl ? (
              <a
                href={integration.authUrl}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Connect
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                Coming Soon
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function APISettings() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateKey = () => {
    // Generate a placeholder API key
    const key = 'oboa_' + Array.from({ length: 32 }, () =>
      Math.random().toString(36)[2]
    ).join('')
    setApiKey(key)
  }

  const copyKey = async () => {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Use API keys to integrate with external systems or automate workflows.
      </p>

      {apiKey ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={copyKey}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-amber-600">
            Make sure to save this key securely. You will not be able to see it again.
          </p>
        </div>
      ) : (
        <button
          onClick={generateKey}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Key className="h-4 w-4" />
          Generate API Key
        </button>
      )}
    </div>
  )
}

export default function Settings() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        <SettingsSection
          title="Profile"
          description="Your personal information"
          icon={User}
        >
          <ProfileSettings />
        </SettingsSection>

        <SettingsSection
          title="Password"
          description="Update your password"
          icon={Key}
        >
          <PasswordSettings />
        </SettingsSection>

        <SettingsSection
          title="Notifications"
          description="Choose what notifications you receive"
          icon={Bell}
        >
          <NotificationSettings />
        </SettingsSection>

        <SettingsSection
          title="Integrations"
          description="Connect external services"
          icon={Link2}
        >
          <IntegrationSettings />
        </SettingsSection>

        <SettingsSection
          title="API Access"
          description="Manage API keys for external integrations"
          icon={Shield}
        >
          <APISettings />
        </SettingsSection>
      </div>
    </div>
  )
}
