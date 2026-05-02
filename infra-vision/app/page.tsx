"use client";

export default function Home() {
  return (
    <div className="relative h-[100dvh] md:h-screen w-full overflow-hidden md:-mt-16">
      {/* Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/videos/infravision_intro.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Hero Content Overlay - ONLY visible on mobile to fix the cut-off video text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 px-6 md:hidden">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tighter text-white mb-4 uppercase">
            Infra<span className="text-[#00A8E8]">Vision</span>
          </h1>
          <p className="text-base text-white/70 font-light tracking-wide mb-8">
            Advanced Urban Intelligence
          </p>
          <div className="flex flex-col gap-3 w-full max-w-[280px] mx-auto">
            <button 
              onClick={() => window.location.href = '/sustainability-intelligence'}
              className="bg-white text-black px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl"
            >
              Access Intelligence
            </button>
            <button 
              onClick={() => window.location.href = '/ai-features'}
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3.5 rounded-xl font-bold text-sm"
            >
              Platform Architecture
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Overlay - Keeps it minimal as requested */}
      <div className="hidden md:block absolute inset-0 bg-black/20"></div>
    </div>
  );
}





