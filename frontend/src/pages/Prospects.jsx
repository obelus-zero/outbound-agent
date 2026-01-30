import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Search, Linkedin, Mail, Sparkles, Trash2, CheckSquare, Square, CheckCircle, XCircle, FlaskConical, ListChecks } from "lucide-react"
import { prospects, messages, sequences } from "../api/client"
import clsx from "clsx"

const statusColors = {
  new: "bg-gray-100 text-gray-800",
  researching: "bg-blue-100 text-blue-800",
  ready_for_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  skipped: "bg-gray-100 text-gray-600",
  contacted: "bg-purple-100 text-purple-800",
  replied: "bg-emerald-100 text-emerald-800",
}

export default function Prospects() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showSequenceModal, setShowSequenceModal] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ["prospects", page, search, statusFilter],
    queryFn: () => prospects.list({
      page,
      per_page: 25,
      search: search || undefined,
      status: statusFilter || undefined,
    }).then(res => res.data),
  })

  const { data: sequencesList } = useQuery({
    queryKey: ["sequences"],
    queryFn: () => sequences.list().then(res => res.data),
  })

  const generateMutation = useMutation({
    mutationFn: (prospectId) => messages.generate({ prospect_id: prospectId }),
    onSuccess: () => queryClient.invalidateQueries(["prospects"]),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => prospects.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries(["prospects"])
      setSelectedIds(new Set())
    },
  })

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }) => prospects.bulkStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["prospects"])
      setSelectedIds(new Set())
    },
  })

  const bulkResearchMutation = useMutation({
    mutationFn: (ids) => prospects.bulkResearch(ids),
    onSuccess: () => {
      queryClient.invalidateQueries(["prospects"])
      setSelectedIds(new Set())
    },
  })

  const bulkGenerateMutation = useMutation({
    mutationFn: async (ids) => {
      const results = []
      for (const id of ids) {
        try {
          await messages.generate({ prospect_id: id })
          results.push({ id, success: true })
        } catch (e) {
          results.push({ id, success: false, error: e.message })
        }
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["prospects"])
      setSelectedIds(new Set())
    },
  })

  const enrollMutation = useMutation({
    mutationFn: ({ prospectIds, sequenceId }) => sequences.enrollProspects(prospectIds, sequenceId),
    onSuccess: () => {
      queryClient.invalidateQueries(["prospects"])
      setSelectedIds(new Set())
      setShowSequenceModal(false)
    },
  })

  const handleSelectAll = () => {
    if (!data?.prospects) return
    if (selectedIds.size === data.prospects.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.prospects.map(p => p.id)))
    }
  }

  const handleSelect = (id) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectedArray = Array.from(selectedIds)
  const isAllSelected = data?.prospects?.length > 0 && selectedIds.size === data.prospects.length
  const isSomeSelected = selectedIds.size > 0

  if (error) {
    return <div className="p-8 text-center text-red-600">Error loading prospects: {error.message}</div>
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your prospect pipeline</p>
        </div>
        <div className="flex gap-2">
          <Link to="/sequences" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Sequences
          </Link>
          <Link to="/import" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Import Prospects
          </Link>
        </div>
      </div>

      {isSomeSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">{selectedIds.size} prospect{selectedIds.size !== 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { if (confirm("Research " + selectedIds.size + " prospects?")) bulkResearchMutation.mutate(selectedArray) }} disabled={bulkResearchMutation.isPending} className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1">
              <FlaskConical className="h-4 w-4" />
              {bulkResearchMutation.isPending ? "Researching..." : "Research"}
            </button>
            <button onClick={() => { if (confirm("Generate messages for " + selectedIds.size + " prospects?")) bulkGenerateMutation.mutate(selectedArray) }} disabled={bulkGenerateMutation.isPending} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              {bulkGenerateMutation.isPending ? "Generating..." : "Generate Messages"}
            </button>
            <button onClick={() => setShowSequenceModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1">
              <ListChecks className="h-4 w-4" />
              Add to Sequence
            </button>
            <button onClick={() => bulkStatusMutation.mutate({ ids: selectedArray, status: "approved" })} disabled={bulkStatusMutation.isPending} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
            <button onClick={() => bulkStatusMutation.mutate({ ids: selectedArray, status: "skipped" })} disabled={bulkStatusMutation.isPending} className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Skip
            </button>
            <button onClick={() => { if (confirm("Delete " + selectedIds.size + " prospects?")) bulkDeleteMutation.mutate(selectedArray) }} disabled={bulkDeleteMutation.isPending} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-gray-600 text-sm hover:text-gray-800">Clear</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or title..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="researching">Researching</option>
            <option value="ready_for_review">Ready for Review</option>
            <option value="approved">Approved</option>
            <option value="contacted">Contacted</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
        ) : data?.prospects?.length > 0 ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button onClick={handleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {isAllSelected ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prospect</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ICP Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.prospects.map((prospect) => (
                  <tr key={prospect.id} className={clsx("hover:bg-gray-50", selectedIds.has(prospect.id) && "bg-blue-50")}>
                    <td className="px-4 py-4">
                      <button onClick={() => handleSelect(prospect.id)} className="text-gray-400 hover:text-gray-600">
                        {selectedIds.has(prospect.id) ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={"/prospects/" + prospect.id} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {prospect.full_name || prospect.linkedin_url?.split("/").pop() || "Unknown"}
                      </Link>
                      <div className="text-sm text-gray-500">{prospect.title || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prospect.company?.name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium", prospect.icp_score >= 80 ? "bg-green-100 text-green-800" : prospect.icp_score >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800")}>
                        {prospect.icp_score}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx("px-2 py-1 text-xs font-medium rounded-full capitalize", statusColors[prospect.status])}>
                        {prospect.status?.replace(/_/g, " ") || "new"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{prospect.source?.replace(/_/g, " ") || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {prospect.linkedin_url && <a href={prospect.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600"><Linkedin className="h-4 w-4" /></a>}
                        {prospect.email && <a href={"mailto:" + prospect.email} className="text-gray-400 hover:text-blue-600"><Mail className="h-4 w-4" /></a>}
                        {prospect.status === "new" && <button onClick={() => generateMutation.mutate(prospect.id)} disabled={generateMutation.isPending} className="text-blue-600 hover:text-blue-700"><Sparkles className="h-4 w-4" /></button>}
                        <Link to={"/prospects/" + prospect.id} className="text-blue-600 hover:text-blue-700">View</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, data.total)} of {data.total} prospects</div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= data.total} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p>No prospects found</p>
            <Link to="/import" className="text-blue-600 text-sm mt-2 inline-block">Import prospects</Link>
          </div>
        )}
      </div>

      {showSequenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add to Sequence</h3>
            <p className="text-sm text-gray-600 mb-4">Select a sequence to enroll {selectedIds.size} prospect{selectedIds.size !== 1 ? "s" : ""} in:</p>
            {sequencesList?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {sequencesList.map(seq => (
                  <button key={seq.id} onClick={() => enrollMutation.mutate({ prospectIds: selectedArray, sequenceId: seq.id })} disabled={enrollMutation.isPending} className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50">
                    <div className="font-medium">{seq.name}</div>
                    <div className="text-sm text-gray-500">{seq.steps?.length || 0} steps</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No sequences created yet</p>
                <Link to="/sequences" className="text-blue-600 text-sm mt-2 inline-block">Create a sequence</Link>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSequenceModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
