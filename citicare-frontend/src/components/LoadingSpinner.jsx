const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin-slow rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
      {message && <p className="text-blue-200/80">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;