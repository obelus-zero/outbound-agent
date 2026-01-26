import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, ChevronLeft, ChevronRight, Linkedin, Mail, ExternalLink } from 'lucide-react'
import { prospects } from '../api/client'
import clsx from 'clsx'

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'bg-green-100 text-green-800'
    : score >= 50 ? 'bg-yellow-100 text-yellow-800'
    : score >= 25 ? 'bg-orange-100 text-orange-800'
    : 'bg-gray-100 text-gray-600'
  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', color)}>
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
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium capitalize', colors[status] || 'bg-gray-100')}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

export default function Prospects() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const page = parseInt(searchParams.get('page') || '1')
  const status = searchParams.get('status') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['prospects', page, status, search],
    queryFn: () => prospects.list({
      page,
      per_page: 20,
      status: status || undefined,
      search: search || undefined,
      sort_by: 'icp_score',
      sort_order: 'desc'
    }).then(res => res.data),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <p className="text-gray-500 mt-1">{data?.total || 0} total prospects</p>
        </div>
        <Link
          to="/import"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Import Prospects
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => setSearchParams({ status: e.target.value, page: '1' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="ready_for_review">Ready for Review</option>
            <option value="approved">Approved</option>
            <option value="contacted">Contacted</option>
            <option value="responded">Responded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : data?.prospects?.length > 0 ? (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ICP Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.prospects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/prospects/${prospect.id}`} className="font-medium text-blue-600 hover:underline">
                        {prospect.full_name}
                      </Link>
                      {prospect.email && (
                        <p className="text-xs text-gray-500">{prospect.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{prospect.title || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{prospect.company_name || '-'}</td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={prospect.icp_score || 0} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={prospect.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {prospect.linkedin_url && (
                          <a
                            href={prospect.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {prospect.email && (
                          <a
                            href={`mailto:${prospect.email}`}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {data.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSearchParams({ status, page: String(page - 1) })}
                    disabled={page === 1}
                    className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSearchParams({ status, page: String(page + 1) })}
                    disabled={page === data.pages}
                    className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No prospects found</p>
            <Link to="/import" className="text-blue-600 mt-2 inline-block hover:underline">
              Import your first prospects →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
