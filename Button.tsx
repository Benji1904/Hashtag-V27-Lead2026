import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'glass';
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '',
  onClick 
}) => {
  const baseStyles = "px-8 py-4 rounded-full font-bold tracking-wider transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 active:scale-95 text-sm uppercase relative overflow-hidden";
  
  const variants = {
    primary: "bg-gradient-royal text-white shadow-candy border-t border-white/40 hover:shadow-jewel-hover hover:brightness-110",
    outline: "bg-transparent border-2 border-royal-main text-royal-main hover:bg-royal-main hover:text-white hover:shadow-lg",
    glass: "glass-jewel text-royal-dark hover:bg-white/60 border-white/80"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {/* Specular Highlight for Candy Effect */}
      {variant === 'primary' && (
        <div className="absolute top-0 left-4 right-4 h-[40%] bg-gradient-to-b from-white/30 to-transparent rounded-b-lg pointer-events-none"></div>
      )}
      
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

export default Button;