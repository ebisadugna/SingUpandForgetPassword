const Input = ({ className = "", error, ...props }) => {
  return (
    <input
      className={`w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      {...props}
    />
  )
}

export default Input
