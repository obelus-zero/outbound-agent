import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, MessageSquare, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react'
import { workflow, prospects } from '../api/client'

function StatCard({ title, value, icon: Icon, color, link }) {
  return (
    <Link to={link} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => workflow.getStats().then(res => res.data),
  })

  const { data: recentProspects } = useQuery({
    queryKey: ['recent-prospects'],
    queryFn: () => prospects.list({ per_page: 5, sort_by: 'created_at', sort_order: 'desc' }).then(res => res.data),
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your outbound sales pipeline</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Prospects"
          value={stats?.total_prospects || 0}
          icon={Users}
          color="bg-blue-500"
          link="/prospects"
        />
        <StatCard
          title="Ready for Review"
          value={stats?.ready_for_review || 0}
          icon={MessageSquare}
          color="bg-yellow-500"
          link="/review"
        />
        <StatCard
          title="Approved"
          value={stats?.approved || 0}
          icon={CheckCircle}
          color="bg-green-500"
          link="/approved"
        />
        <StatCard
          title="Contacted"
          value={stats?.contacted || 0}
          icon={TrendingUp}
          color="bg-purple-500"
          link="/prospects?status=contacted"
        />
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prospects */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Prospects</h2>
            <Link to="/prospects" className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentProspects?.prospects?.length > 0 ? (
              recentProspects.prospects.map((prospect) => (
                <Link
                  key={prospect.id}
                  to={`/prospects/${prospect.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{prospect.full_name}</p>
                    <p className="text-sm text-gray-500">{prospect.title} at {prospect.company_name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    prospect.icp_score >= 70 ? 'bg-green-100 text-green-700' :
                    prospect.icp_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {prospect.icp_score || 0} ICP
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No prospects yet. Import some to get started!</p>
            )}
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline</h2>
          <div className="space-y-3">
            {[
              { label: 'New', value: stats?.new || 0, color: 'bg-gray-400' },
              { label: 'Researching', value: stats?.researching || 0, color: 'bg-blue-400' },
              { label: 'Ready for Review', value: stats?.ready_for_review || 0, color: 'bg-yellow-400' },
              { label: 'Approved', value: stats?.approved || 0, color: 'bg-green-400' },
              { label: 'Contacted', value: stats?.contacted || 0, color: 'bg-purple-400' },
              { label: 'Responded', value: stats?.responded || 0, color: 'bg-indigo-400' },
              { label: 'Meeting Booked', value: stats?.meeting_booked || 0, color: 'bg-pink-400' },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                <span className="flex-1 text-gray-700">{stage.label}</span>
                <span className="font-medium text-gray-900">{stage.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
