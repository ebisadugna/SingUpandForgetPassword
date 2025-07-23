"use client"

import { useAuth } from "../contexts/AuthContext"
import { User, Mail, Shield, Calendar } from "lucide-react"
import axios from "axios"
import { useEffect, useState } from "react"

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
}

const Dashboard = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [responses, setResponses] = useState([])

  useEffect(() => {
    if (user && user.role !== "admin") {
      fetchTasksAndResponses()
    }
  }, [user])

  const fetchTasksAndResponses = async () => {
    try {
      const [tasksRes, responsesRes] = await Promise.all([
        axios.get("/api/tasks"),
        user.role === "admin"
          ? axios.get("/api/responses")
          : axios.get("/api/responses/my"),
      ])
      setTasks(tasksRes.data.tasks || [])
      setResponses(responsesRes.data.responses || [])
    } catch (err) {
      // Optionally handle error
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user.role === "admin") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 mt-2">Here's your personal dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start space-x-4 overflow-hidden">
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900 truncate" title={user.email}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>


          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-semibold text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {user.avatar ? (
                  <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="h-16 w-16 rounded-full" />
                ) : (
                  <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-700">Update Profile</span>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-700">Security Settings</span>
                </div>
              </button>

              {user.role === "admin" && (
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Admin Panel</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // User dashboard: show tasks, their response, and status
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
        <p className="text-gray-600 mt-2">Here's your personal dashboard</p>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-start space-x-4 overflow-hidden">
            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-lg font-semibold text-gray-900 truncate" title={user.email}>
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Removed duplicate status card */}
      </div>

      {/* User's Responses Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Submitted Responses</h2>
        {responses.length === 0 ? (
          <div className="text-gray-500">No responses submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Image Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Your Response</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Submitted Date</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((resp, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <img
                          src={resp.task?.imageUrl}
                          alt={resp.task?.originalName}
                          className="h-12 w-12 object-cover rounded mr-3"
                        />
                        <span className="font-medium">{resp.task?.originalName || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{resp.response}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[resp.status] || "bg-gray-100 text-gray-800"}`}>
                        {resp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(resp.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
