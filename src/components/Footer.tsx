import { MapPin, Clock, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              JG <span className="text-accent">MODAS</span>
            </h3>
            <p className="text-sm opacity-90">
              Tradição desde 1981. Moda masculina moderna com qualidade, estilo e preço justo.
            </p>
            <br />
          <p className="opacity-90">Feito por <a href="https://github.com/vitor-daniel015"><span className="text-accent text-lg font-bold">Vitor Daniel</span></a> - <a href="https://api.whatsapp.com/send?phone=5515998571316">(15) 99857-1316</a></p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Horário de Funcionamento
            </h4>
            <div className="space-y-2 text-sm opacity-90">
              <p>Segunda a Sexta: 09h às 18h</p>
              <p>Sábado: 09h às 17h</p>
              <p>Domingo: Fechado</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              Contato
            </h4>
            <div className="space-y-2 text-sm opacity-90">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                (15) 99616-4393
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-sm opacity-75">
          <p>© {new Date().getFullYear()} JG MODAS. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
