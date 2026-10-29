export default function Loader() {
  return (
    <div
      className="flex justify-center items-center h-screen"
      role="status"
      aria-label="Loading..."
    >
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );
}
