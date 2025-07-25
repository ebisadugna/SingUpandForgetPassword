import React, { useEffect, useState } from "react";
// import axios from "axios";
import axios from "../config/axios";
import { useAuth } from "../contexts/AuthContext";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const UserResponses = () => {
  const { isAdmin, user } = useAuth();
  const [responses, setResponses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState({});
  const [responseInputs, setResponseInputs] = useState({});
  const [responseMsg, setResponseMsg] = useState({});

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tasksRes, responsesRes] = await Promise.all([
        axios.get("/api/tasks"),
        isAdmin
          ? axios.get("/api/responses")
          : axios.get("/api/responses/my"),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setResponses(responsesRes.data.responses || []);
      console.log("respnse",tasksRes.data.tasks);
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  // For non-admins, filter to only their responses
  const myResponses = responses.filter((resp) => resp.user && user && resp.user._id === user._id);
  console.log("myResponses",myResponses)
  const myResponsesByTask = Object.fromEntries(myResponses.map(r => [r.task?._id, r]));
  console.log("id",myResponsesByTask)

  const handleStatusChange = async (id, newStatus) => {
    setStatusUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(`/api/responses/${id}`, { status: newStatus });
      setResponses((prev) =>
        prev.map((resp) =>
          resp._id === id ? { ...resp, status: newStatus } : resp
        )
      );
    } catch (err) {
      // Optionally show error
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleResponseChange = (taskId, value) => {
    setResponseInputs((prev) => ({ ...prev, [taskId]: value }));
    setResponseMsg((prev) => ({ ...prev, [taskId]: "" }));
  };

  const handleResponseSubmit = async (e, taskId) => {
    e.preventDefault();
    if (!responseInputs[taskId]) {
      setResponseMsg((prev) => ({ ...prev, [taskId]: "Please enter a response." }));
      return;
    }
    try {
      await axios.post("/api/responses", { taskId, response: responseInputs[taskId] });
      setResponseMsg((prev) => ({ ...prev, [taskId]: "Response submitted!" }));
      setResponseInputs((prev) => ({ ...prev, [taskId]: "" }));
      fetchData();
    } catch (err) {
      setResponseMsg((prev) => ({ ...prev, [taskId]: "Failed to submit response." }));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  if (isAdmin) {
    // Admin: show all responses table
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">User Responses</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 border">User</th>
                <th className="px-4 py-2 border">Task</th>
                <th className="px-4 py-2 border">Response</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Change Status</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((resp, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{resp.user?.name || "-"}</td>
                  <td className="px-4 py-2 border">{resp.task?.originalName || "-"}</td>
                  <td className="px-4 py-2 border">{resp.response || "-"}</td>
                  <td className="px-4 py-2 border">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[resp.status] || "bg-gray-100 text-gray-800"}`}>
                      {resp.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border">
                    <select
                      value={resp.status}
                      onChange={(e) => handleStatusChange(resp._id, e.target.value)}
                      disabled={statusUpdating[resp._id]}
                      className="border rounded px-2 py-1"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // User: show all tasks, allow response if not already submitted, show status if submitted
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Task Responses</h1>
      {tasks.length === 0 ? (
        <div>No tasks uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const myResp = myResponsesByTask[task._id];
            return (
              <div key={task._id} className="bg-white rounded shadow p-4 flex flex-col items-center">
                <img
                  src={task.imageUrl}
                  alt={task.originalName}
                  className="h-40 w-auto object-contain mb-2 border rounded"
                  style={{ maxWidth: "100%" }}
                />
                <div className="font-medium mb-2">{task.originalName}</div>
                {myResp ? (
                  <>
                    <div className="mb-1">Your Response: <span className="font-semibold">{myResp.response}</span></div>
                    <div>Status: <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[myResp.status] || "bg-gray-100 text-gray-800"}`}>{myResp.status}</span></div>
                  </>
                ) : (
                  <form onSubmit={(e) => handleResponseSubmit(e, task._id)} className="w-full">
                    <input
                      type="text"
                      placeholder="Enter your response"
                      value={responseInputs[task._id] || ""}
                      onChange={(e) => handleResponseChange(task._id, e.target.value)}
                      className="w-full border rounded px-2 py-1 mb-2"
                    />
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Submit Response
                    </button>
                    {responseMsg[task._id] && (
                      <div className="mt-1 text-sm text-center text-blue-600">{responseMsg[task._id]}</div>
                    )}
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserResponses; 