import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8 relative overflow-hidden">
      {/* Decorative Pattern Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <img src="/logo.png" alt="Top Pastel" className="w-8 h-8 object-cover rounded-full" />
              </div>
              <span className="font-serif text-2xl font-bold">Top Pastel</span>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              Levando o autêntico sabor do Brasil para a sua mesa. Massa fresquinha, crocante e feita com amor.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-6 text-secondary">Navegação</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-primary-foreground/80 hover:text-white hover:translate-x-1 transition-all inline-block">Início</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-6 text-secondary">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-primary-foreground/80">
                <MapPin className="w-5 h-5 mt-1 shrink-0 text-secondary" />
                <span>Guimarães, Portugal</span>
              </li>
              <li className="flex items-center gap-3 text-primary-foreground/80">
                <Phone className="w-5 h-5 shrink-0 text-secondary" />
                <span>+351 937675660</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-6 text-secondary">Novidades</h3>
            <p className="text-primary-foreground/80 mb-4 text-sm">
              Receba receitas exclusivas e promoções diretamente no seu email.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Seu email" 
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
              />
              <button className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-white hover:text-primary transition-all duration-300 shadow-lg">
                Subscrever
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p>&copy; 2026 Top Pastel. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
