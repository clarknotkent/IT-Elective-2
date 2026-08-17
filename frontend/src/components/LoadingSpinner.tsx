export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
      <div className="w-8 h-8 border-4 border-accent-200 border-t-accent-500 rounded-full animate-spin"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
