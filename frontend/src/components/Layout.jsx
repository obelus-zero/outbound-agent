import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  Target,
  Upload,
  LogOut,
  CheckSquare,
  ListOrdered
} from 'lucide-react'
import useAuthStore from '../hooks/useAuth'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Review Queue', href: '/review', icon: CheckSquare },
  { name: 'Prospects', href: '/prospects', icon: Users },
  { name: 'Sequences', href: '/sequences', icon: ListOrdered },
  { name: 'ICP Config', href: '/icp', icon: Target },
  { name: 'Import', href: '/import', icon: Upload },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout({ children }) {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Outbound Agent</span>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className={clsx('h-5 w-5 mr-3', isActive ? 'text-blue-600' : 'text-gray-400')} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button onClick={logout} className="ml-2 p-1 text-gray-400 hover:text-gray-600" title="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
