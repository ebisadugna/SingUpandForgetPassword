import { useState, useEffect } from "react"
// import axios from "axios"
import axios from "../config/axios"
import toast from "react-hot-toast"
import { Users, Shield, UserCheck, UserX, Trash2 } from "lucide-react"

const AdminDashboard = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users")
      setUsers(response.data.users)
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    setActionLoading({ ...actionLoading, [userId]: true })
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole })
      setUsers(users.map((user) => (user._id === userId ? { ...user, role: newRole } : user)))
      toast.success(`User role updated to ${newRole}`)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user role")
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false })
    }
  }

  const toggleUserStatus = async (userId) => {
    setActionLoading({ ...actionLoading, [userId]: true })
    try {
      await axios.put(`/api/users/${userId}/status`)
      setUsers(users.map((user) => (user._id === userId ? { ...user, isActive: !user.isActive } : user)))
      toast.success("User status updated")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user status")
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false })
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return
    }

    setActionLoading({ ...actionLoading, [userId]: true })
    try {
      await axios.delete(`/api/users/${userId}`)
      setUsers(users.filter((user) => user._id !== userId))
      toast.success("User deleted successfully")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user")
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = {
    total: users.length,
    admins: users.filter((user) => user.role === "admin").length,
    active: users.filter((user) => user.isActive).length,
    inactive: users.filter((user) => !user.isActive).length,
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage users and system settings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {user.role === "user" ? (
                        <button
                          onClick={() => updateUserRole(user._id, "admin")}
                          disabled={actionLoading[user._id]}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                          title="Promote to Admin"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserRole(user._id, "user")}
                          disabled={actionLoading[user._id]}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Demote to User"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => toggleUserStatus(user._id)}
                        disabled={actionLoading[user._id]}
                        className={`${
                          user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"
                        } disabled:opacity-50`}
                        title={user.isActive ? "Deactivate User" : "Activate User"}
                      >
                        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>

                      <button
                        onClick={() => deleteUser(user._id)}
                        disabled={actionLoading[user._id]}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
