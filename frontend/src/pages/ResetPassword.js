import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"
import toast from "react-hot-toast"
import axios from "axios"

const ResetPassword = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [errors, setErrors] = useState({})
  const [resetSuccess, setResetSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const [validToken, setValidToken] = useState(false)

  const { token } = useParams()

  useEffect(() => {
    console.log("ResetPassword component mounted with token:", token)
    const verifyToken = async () => {
      if (!token) {
        toast.error("Invalid reset link")
        navigate("/forgot-password")
        return
      }

      try {
        const res = await axios.post("http://localhost:5000/api/auth/verify-reset-code", { token })
        setEmail(res.data.email)
        setValidToken(true)
      } catch (error) {
        console.error("Token verification error:", error)
        toast.error(error.response?.data?.message || "Invalid or expired reset link")
        navigate("/forgot-password")
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token, navigate])

  const validateForm = () => {
    const newErrors = {}
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
        newPassword: formData.password,
      })

      toast.success("Password reset successful!")
      setResetSuccess(true)
    } catch (error) {
      console.error("Reset password error:", error)
      toast.error(error.response?.data?.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return <div className="text-center p-10">Verifying reset link...</div>
  }

  if (resetSuccess) {
    return (
      <div className="text-center p-10">
        <CheckCircle className="mx-auto text-green-500 w-12 h-12" />
        <h2 className="text-xl font-bold mt-4">Password reset successful</h2>
        <p className="text-gray-600 mt-2">You can now login with your new password.</p>
        <Link to="/login" className="text-blue-600 underline mt-4 block">Go to login</Link>
      </div>
    )
  }

  if (!validToken) {
    return (
      <div className="text-center p-10">
        <XCircle className="mx-auto text-red-500 w-12 h-12" />
        <h2 className="text-xl font-bold mt-4">Invalid or expired link</h2>
        <Link to="/forgot-password" className="text-blue-600 underline mt-4 block">Request another</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Reset your password</h2>
      <p className="text-center text-sm text-gray-600 mb-4">Resetting for: <b>{email}</b></p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium">New Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className={`w-full px-3 py-2 border rounded ${errors.password ? "border-red-500" : "border-gray-300"}`}
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="button" className="absolute right-2 top-2" onClick={() => setShowPassword(p => !p)}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirm Password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className={`w-full px-3 py-2 border rounded ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button type="button" className="absolute right-2 top-2" onClick={() => setShowConfirmPassword(p => !p)}>
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  )
}

export default ResetPassword
