export default function Loader({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-10 h-10 border-4 border-secondary-container border-t-transparent rounded-full animate-spin dark:border-[#ffa52d] dark:border-t-transparent" />
    </div>
  )
}
