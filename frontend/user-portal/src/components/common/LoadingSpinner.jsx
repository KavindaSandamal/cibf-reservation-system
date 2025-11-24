

function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <h5 className="text-slate-600 font-semibold">{message}..</h5>
        </div>
      </div>
  );
}

export default LoadingSpinner;

