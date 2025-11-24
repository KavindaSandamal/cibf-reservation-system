import React from 'react';

const HeroSection = ({ 
  title = "Welcome Back!", 
  subtitle = "Reserve Your Book Stall Today",
  imageSrc = "/images/book2.jpg",
  imageAlt = "Books Collection"
}) => {
  return (
    <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-950 to-[#0a1128]">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white max-w-2xl">
            <h2 className="text-4xl font-bold mb-4 drop-shadow-2xl animate-fade-in">{title}</h2>
            <p className="text-xl opacity-90 mb-12 drop-shadow-lg">{subtitle}</p>
            
            {/* Book Image with Enhanced Styling */}
            <div className="relative w-full max-w-2xl mx-auto group">
              {/* Decorative background cards */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-3xl transform rotate-3 scale-105 group-hover:rotate-6 transition-transform duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-3xl transform -rotate-2 scale-105 group-hover:-rotate-4 transition-transform duration-500"></div>
              
              {/* Main image container */}
              <div className="relative bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                <img 
                  src={imageSrc} 
                  alt={imageAlt} 
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
                
                {/* Decorative corner accents */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-400/40 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-pink-400/40 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;