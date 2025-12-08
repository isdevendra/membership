
'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/icons';
import { type Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import Image from 'next/image';

interface MembershipCardProps {
  member: Member;
}

const toDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue.toDate) { // Firestore Timestamp
      return dateValue.toDate();
    }
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
     if (dateValue instanceof Date) {
        return dateValue;
    }
    return null;
};

export function MembershipCard({ member }: MembershipCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/members/${member.id}` : '';

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow && cardRef.current) {
        printWindow.document.write('<html><head><title>Print Membership Card</title>');

        // Link all stylesheets from the parent document to the new window
        Array.from(document.styleSheets).forEach(styleSheet => {
            if (styleSheet.href) {
                const link = printWindow.document.createElement('link');
                link.rel = 'stylesheet';
                link.href = styleSheet.href;
                printWindow.document.head.appendChild(link);
            }
        });
        
        // Inject inline styles for any dynamic styling not in external sheets
        const inlineStyles = Array.from(document.querySelectorAll('style'))
            .map(style => style.innerHTML)
            .join('');
        const styleElement = printWindow.document.createElement('style');
        styleElement.innerHTML = inlineStyles;
        
        // Add specific print styles
        styleElement.innerHTML += `
            @media print {
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .no-print {
                    display: none !important;
                }
                #printable-card {
                    transform: scale(1) !important;
                    box-shadow: none !important;
                    border: none !important;
                }
            }
        `;
        printWindow.document.head.appendChild(styleElement);
        
        printWindow.document.write('</head><body style="display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f0f0f0;">');

        const printableCard = cardRef.current.cloneNode(true) as HTMLDivElement;
        printableCard.id = "printable-card";
        // Use inline styles for dimensions to ensure they are applied
        printableCard.style.width = "3.375in";
        printableCard.style.height = "2.125in";
        printableCard.style.transform = "scale(1.5)"; // Make it larger for viewing before print
        printableCard.style.transformOrigin = "center";
        
        printWindow.document.body.innerHTML = printableCard.outerHTML;
        
        // Use a timeout to ensure all styles and images are loaded before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1000);
    }
  };

  const expiryDate = toDate(member.expiryDate);
  const joinDate = toDate(member.joinDate);

  return (
    <div>
        <div ref={cardRef} className={cn(
            "aspect-[85.6/54] w-full max-w-sm rounded-xl p-4 flex flex-col justify-between text-white",
            "bg-gradient-to-br from-primary via-primary/80 to-black shadow-2xl"
        )}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    {settings.logoUrl ? (
                        <Image src={settings.logoUrl} alt={settings.casinoName} width={32} height={32} className="rounded-sm"/>
                    ) : (
                        <Logo className="size-8" />
                    )}
                    <span className="text-lg font-bold font-headline">{settings.casinoName}</span>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg leading-tight">{member.tier}</p>
                    <p className="text-xs uppercase tracking-widest">Member</p>
                </div>
            </div>

            <div className="flex items-end gap-4">
                <Avatar className="h-20 w-20 border-2 border-white">
                    <AvatarImage src={member.photo} alt={member.fullName} />
                    <AvatarFallback className="text-3xl text-black">{member.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-mono text-xs opacity-80">Name</p>
                    <p className="font-semibold text-lg leading-tight">{member.fullName}</p>
                    <p className="font-mono text-xs opacity-80">{member.id}</p>
                </div>
                 {profileUrl && (
                    <div className="bg-white p-1 rounded-sm">
                        <QRCode value={profileUrl} size={48} />
                    </div>
                )}
            </div>

            <div className="flex justify-between items-end text-xs font-mono">
                <div>
                    <p>Member Since</p>
                    <p>{joinDate ? format(joinDate, "MM/yy") : 'N/A'}</p>
                </div>
                <div className="text-right">
                    <p>Expires</p>
                    <p>{expiryDate ? format(expiryDate, "MM/yy") : 'N/A'}</p>
                </div>
            </div>
        </div>
        <div className="flex flex-col items-center mt-4 space-y-4 no-print">
            <Button onClick={handlePrint} className="w-full">Print Card</Button>
        </div>
    </div>
  );
}
