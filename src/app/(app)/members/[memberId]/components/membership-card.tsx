
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
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow && cardRef.current) {
        printWindow.document.write('<html><head><title>Print Membership Card</title>');
        // We need to inject the styles into the new window
        const styles = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('');
                } catch (e) {
                    console.warn('Could not read stylesheet for printing:', e);
                    return '';
                }
            })
            .join('');
        printWindow.document.write(`<style>${styles}</style>`);
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } #printable-card { transform: scale(1) !important; box-shadow: none !important; border: none !important; } }</style>');
        printWindow.document.write('</head><body style="display: flex; align-items: center; justify-content: center; height: 100%;">');
        
        // Clone the card and give it an ID for styling
        const printableCard = cardRef.current.cloneNode(true) as HTMLDivElement;
        printableCard.id = "printable-card";
        printableCard.style.width = "3.375in"; // Standard card width
        printableCard.style.height = "2.125in"; // Standard card height
        printableCard.style.transform = "scale(2)"; // Make it larger for better viewing before printing
        
        printWindow.document.write(printableCard.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Delay printing to allow images and styles to load
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
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
                    <AvatarFallback className="text-2xl text-black">{member.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-mono text-xs opacity-80">Name</p>
                    <p className="font-semibold text-lg leading-tight">{member.fullName}</p>
                    <p className="font-mono text-sm opacity-80">{member.id}</p>
                </div>
                <div className="bg-white p-1 rounded-md">
                    {profileUrl && <QRCode value={profileUrl} size={50} />}
                </div>
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
        <Button onClick={handlePrint} className="w-full mt-4 no-print">Print Card</Button>
    </div>
  );
}
