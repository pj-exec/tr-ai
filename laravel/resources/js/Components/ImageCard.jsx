export default function ImageCard({ image, children }) {
  return (
    <div className="flex flex-col justify-between bg-white rounded-lg shadow-md p-4">
      <img src={image} className="w-full h-auto object-cover rounded-md" />
      {children}
    </div>
  );
}
