import React, { useState, useEffect } from "react";
// import axios from "axios";
import axios from "../config/axios";
import { useAuth } from "../contexts/AuthContext";

const UploadTask = () => {
  const { isAdmin, user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const [responses, setResponses] = useState({}); // { [taskId]: responseText }
  const [responseMsg, setResponseMsg] = useState({}); // { [taskId]: msg }

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get("/api/tasks");
      setTasks(res.data.tasks || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select an image to upload.");
      return;
    }
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("image", file);
    try {
      await axios.post("/api/tasks/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Image uploaded successfully!");
      setFile(null);
      setPreview(null);
      fetchTasks();
    } catch (error) {
      setMessage("Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (taskId, value) => {
    setResponses((prev) => ({ ...prev, [taskId]: value }));
    setResponseMsg((prev) => ({ ...prev, [taskId]: "" }));
  };

  const handleResponseSubmit = async (e, taskId) => {
    e.preventDefault();
    if (!responses[taskId]) {
      setResponseMsg((prev) => ({ ...prev, [taskId]: "Please enter a response." }));
      return;
    }
    try {
      await axios.post("/api/responses", { taskId, response: responses[taskId] });
      setResponseMsg((prev) => ({ ...prev, [taskId]: "Response submitted!" }));
      setResponses((prev) => ({ ...prev, [taskId]: "" }));
    } catch (err) {
      setResponseMsg((prev) => ({ ...prev, [taskId]: "Failed to submit response." }));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Upload Task Image</h1>
      {isAdmin && (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {preview && (
            <div className="mt-2">
              <img src={preview} alt="Preview" className="h-40 rounded border" />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
          {message && <div className="mt-2 text-sm text-center text-red-500">{message}</div>}
        </form>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Task Images</h2>
        <p className="mb-4 text-gray-600">Below are all uploaded tasks. {isAdmin ? "" : "Enter your response for each task."}</p>
        {tasks.length === 0 ? (
          <div>No tasks uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div key={task._id} className="bg-white rounded shadow p-4 flex flex-col items-center">
                <img
                  src={task.imageUrl}
                  alt={task.originalName}
                  className="h-40 w-auto object-contain mb-2 border rounded"
                  style={{ maxWidth: "100%" }}
                />
                <div className="font-medium mb-2">{task.originalName}</div>
                {!isAdmin && user && (
                  <form onSubmit={(e) => handleResponseSubmit(e, task._id)} className="w-full">
                    <input
                      type="text"
                      placeholder="Enter your response"
                      value={responses[task._id] || ""}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadTask; 