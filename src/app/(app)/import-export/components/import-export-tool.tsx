
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCollection, useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { type Member, MemberTier, MemberStatus } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toDate } from '@/lib/utils';

const memberImportSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  tier: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum', 'Regular', 'VIP', 'Staff', 'Blacklist']),
  points: z.coerce.number().int().min(0),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  governmentId: z.string().optional(),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format for dob" }).optional(),
  joinDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format for joinDate" }).optional(),
  expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format for expiryDate" }).optional(),
});


export function ImportExportTool() {
  const firestore = useFirestore();
  const membersCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'memberships') : null), [firestore]);
  const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersCollectionRef);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleExport = () => {
    if (!members || members.length === 0) {
      toast({ variant: 'destructive', title: 'No members to export' });
      return;
    }

    const headers = [
        'id', 'fullName', 'email', 'tier', 'points', 'phone', 'address', 
        'dob', 'gender', 'nationality', 'governmentId', 
        'joinDate', 'expiryDate', 'status'
    ];
    const csvRows = [
      headers.join(','),
      ...members.map(member => {
        const joinDate = toDate(member.joinDate);
        const expiryDate = toDate(member.expiryDate);
        const dob = toDate(member.dob);

        const row = [
          member.id,
          `"${member.fullName.replace(/"/g, '""')}"`,
          member.email,
          member.tier,
          member.points,
          `"${member.phone || ''}"`,
          `"${(member.address || '').replace(/"/g, '""').replace(/\\n/g, ' ')}"`,
          dob ? dob.toISOString() : '',
          member.gender || '',
          member.nationality || '',
          member.governmentId || '',
          joinDate ? joinDate.toISOString() : '',
          expiryDate ? expiryDate.toISOString() : '',
          member.status || 'Checked Out'
        ];
        return row.join(',');
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "members_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'Export Successful', description: `${members.length} members exported.` });
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore || !membersCollectionRef) return;
  
    setIsImporting(true);
    setImportProgress(0);
    setImportErrors([]);
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header
      const totalRows = rows.length;
      let successfulImports = 0;
      const errors: string[] = [];
  
      for (let i = 0; i < totalRows; i++) {
        const rowText = rows[i].trim();
        if (!rowText) continue;

        // Basic CSV parsing, not robust for all cases (e.g. commas in fields)
        const row = rowText.split(',');
  
        const rowData = {
          fullName: row[0]?.replace(/"/g, ''),
          email: row[1],
          tier: row[2] as MemberTier,
          points: parseInt(row[3], 10),
          phone: row[4]?.replace(/"/g, ''),
          address: row[5]?.replace(/"/g, ''),
          dob: row[6],
          joinDate: row[7],
          expiryDate: row[8],
        };
  
        const validation = memberImportSchema.safeParse(rowData);
  
        if (!validation.success) {
          errors.push(`Row ${i + 2}: ${validation.error.errors.map(e => e.message).join(', ')}`);
        } else {
          try {
            
            const newId = Date.now().toString() + i;
            
            addDocumentNonBlocking(membersCollectionRef, {
              id: newId,
              ...validation.data,
              points: validation.data.points || 0,
              joinDate: validation.data.joinDate ? Timestamp.fromDate(new Date(validation.data.joinDate)) : Timestamp.now(),
              dob: validation.data.dob ? Timestamp.fromDate(new Date(validation.data.dob)) : Timestamp.now(),
              expiryDate: validation.data.expiryDate ? Timestamp.fromDate(new Date(validation.data.expiryDate)) : Timestamp.now(),
              status: 'Checked Out' as MemberStatus,
            });
            successfulImports++;
          } catch (error: any) {
            errors.push(`Row ${i + 2}: Failed to import - ${error.message}`);
          }
        }
        setImportProgress(((i + 1) / totalRows) * 100);
      }
  
      setIsImporting(false);
      setImportErrors(errors);
  
      if (successfulImports > 0) {
        toast({
          title: 'Import Complete',
          description: `Successfully imported ${successfulImports} of ${totalRows > 0 ? totalRows -1 : 0} members.`,
        });
      }
      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Import Errors',
          description: `Encountered ${errors.length} errors. See details on the page.`,
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
  
  const downloadTemplate = () => {
    const headers = 'fullName,email,tier,points,phone,address,dob,joinDate,expiryDate';
    const exampleRow = `"John Doe",john.doe@example.com,Gold,1500,"123-456-7890","123 Casino St","1990-01-15T00:00:00.000Z","2023-01-01T00:00:00.000Z","2025-01-01T00:00:00.000Z"`;
    const csvContent = "data:text/csv;charset=utf-8," + [headers, exampleRow].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Export Member Data</CardTitle>
          <CardDescription>
            Download a CSV file of all members in the database. This includes their profile information and current points balance.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleExport} disabled={isLoadingMembers || !members || members.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {isLoadingMembers ? 'Loading members...' : `Export ${members?.length || 0} Members`}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Members from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file to bulk-add new members. Download the template to ensure your data is formatted correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex gap-2">
                <Button variant="secondary" onClick={() => document.getElementById('csv-import')?.click()} disabled={isImporting}>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose CSV File
                </Button>
                <input type="file" id="csv-import" accept=".csv" className="hidden" onChange={handleImport} />
                <Button variant="outline" onClick={downloadTemplate}>
                    <FileText className="mr-2 h-4 w-4" />
                    Download Template
                </Button>
             </div>
             {isImporting && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Importing members...</p>
                    <Progress value={importProgress} />
                </div>
             )}
             {importErrors.length > 0 && !isImporting && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Import Failed</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc list-inside max-h-40 overflow-y-auto">
                            {importErrors.map((error, index) => (
                                <li key={index} className="text-xs">{error}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
             )}
             {!isImporting && importErrors.length === 0 && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Ready to Import</AlertTitle>
                    <AlertDescription>
                       Please use the template for the correct format. Required columns are: fullName, email, tier, and points. All dates should be in ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ss.sssZ).
                    </AlertDescription>
                </Alert>
             )}
        </CardContent>
      </Card>
    </div>
  );
}
