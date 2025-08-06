import Link from 'next/link';

export default function LandingOutside() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">Welcome to Tom & Danny</h1>
        <p className="mb-8">Order ahead or reserve your spot for pickup!</p>
        <div className="flex flex-col gap-4">
          <Link href="/menu?mode=takeaway">
            <button className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">Order Now</button>
          </Link>
          <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold opacity-60 cursor-not-allowed" disabled>Reservation Order (Coming Soon)</button>
        </div>
      </div>
    </div>
  );
} 