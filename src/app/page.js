// app/page.js
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative overflow-hidden flex items-center justify-center h-screen bg-[#F16B5E] cursor-default">
      {/* Pixel Animation Background */}
      <div className="absolute inset-0 z-0">
        {[...Array(50)].map((_, i) => (
          <div key={i} className={`particle-animation particle-${i % 5}`}></div>
        ))}
      </div>

      <div className="text-center">
        <div className="flex flex-col space-y-10 items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-[#fffff] p-3 rounded-full">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 14l9-5-9-5-9 5 9 5z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 14l6.16-3.422a12.082 12.082 0 01.633 2.284L12 21l-6.793-8.137a12.082 12.082 0 01.633-2.284L12 14z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 14V4m0 10l3.978-2.284a12.084 12.084 0 01-7.956 0L12 14z"
                ></path>
              </svg>
            </div>

            <div className="flex space-between">
              <h1 className="text-4xl font-bold text-gray-800 tracking-wider">
                <span className="text-[#784B25]">LYCA</span>
                <span className="text-gray-800">SNAP</span>
              </h1>
            </div>
          </div>
          <div>
            <div className="flex flex-col md:flex-row space-y-5 md:space-y-0 space-x-0 md:space-x-10">
              <Link
                href="/face-detection"
                className="bg-[#F16B5E] text-white font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out"
                style={{
                  boxShadow:
                    "5px 5px 15px rgba(0, 0, 0, 0.1), -5px -5px 15px rgba(255, 255, 255, 0.2)",
                }}
              >
                Face Detection
              </Link>
              <Link
                href="/face-landmark"
                className="bg-[#F16B5E] text-white font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out h-full"
                style={{
                  boxShadow:
                    "5px 5px 15px rgba(0, 0, 0, 0.1), -5px -5px 15px rgba(255, 255, 255, 0.2)",
                }}
              >
                Face Landmark
              </Link>
              <Link
                href="/hair-segmenter"
                className="bg-[#F16B5E] text-white font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out h-full"
                style={{
                  boxShadow:
                    "5px 5px 15px rgba(0, 0, 0, 0.1), -5px -5px 15px rgba(255, 255, 255, 0.2)",
                }}
              >
                Hair Segmenter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
