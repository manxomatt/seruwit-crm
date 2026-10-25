import React from 'react';
import { Brand } from '../types';

interface FloatingWhatsAppProps {
    brand?: Brand;
}

export default function FloatingWhatsApp({ brand }: FloatingWhatsAppProps) {
    const rawPhone = brand?.support_phone || '081234567890';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const phone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(`Halo ${brand?.name || 'Rental'}, saya ingin bertanya mengenai rental mobil.`)}`;

    return (
        <aside aria-label="Bantuan WhatsApp" className="fixed bottom-6 right-6 z-40 flex items-center group">
            {/* Tooltip */}
            <div className="mr-3 hidden sm:block bg-white text-slate-800 text-xs font-bold py-1.5 px-3 rounded-xl shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Chat CS Rental (24 Jam)
            </div>

            {/* WA Button */}
            <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 w-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 relative"
                aria-label="Hubungi WhatsApp Customer Service"
            >
                {/* Ping Indicator */}
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
                </span>

                <span className="material-symbols-outlined text-[30px]">chat</span>
            </a>
        </aside>
    );
}
