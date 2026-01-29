import { Button } from "@/components/ui/button";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-12 h-12 overflow-hidden rounded-full border-2 border-secondary shadow-sm group-hover:scale-105 transition-transform duration-300">
            <img 
              src="/logo.png" 
              alt="Top Pastel Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-serif text-2xl font-bold text-primary tracking-tight group-hover:text-primary/80 transition-colors">
            Top Pastel
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-secondary/20 hover:text-primary transition-colors"
            onClick={() => setLocation('/checkout')}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => setLocation('/checkout')}
          >
            Comprar Agora
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-background border-b border-border shadow-xl animate-in slide-in-from-top-5">
          <div className="flex flex-col p-6 gap-4">
            <div className="h-px bg-border my-2"></div>
            <Button 
              variant="default" 
              size="lg" 
              className="w-full"
              onClick={() => {
                setLocation('/checkout');
                setIsOpen(false);
              }}
            >
              Comprar Agora
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
