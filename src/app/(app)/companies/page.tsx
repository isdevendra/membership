'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import type { Role } from '@/lib/roles';

type Company = {
    id: string;
    name: string;
    logoUrl?: string;
};

function AddCompanyDialog({ onCompanyAdded }: { onCompanyAdded: () => void }) {
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = React.useState(false);
    const [name, setName] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleAddCompany = async () => {
        if (!firestore) return;
        setIsLoading(true);
        try {
            const companiesCollection = collection(firestore, 'companies');
            await addDocumentNonBlocking(companiesCollection, {
                name: name,
                logoUrl: '',
            });
            onCompanyAdded();
            toast({ title: 'Company Created', description: `Successfully created company ${name}.` });
            setIsOpen(false);
            setName('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error creating company', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button size="sm" className="ml-auto gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Company
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
                    <DialogDescription>
                        Create a new company profile. You can assign users to it later.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Company Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddCompany} disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Company'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditCompanyDialog({ company, children }: { company: Company; children: React.ReactNode }) {
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = React.useState(false);
    const [name, setName] = React.useState(company.name);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setName(company.name);
        }
    }, [isOpen, company.name]);
    
    const handleSaveChanges = () => {
        if (!firestore) return;
        setIsLoading(true);

        const companyDocRef = doc(firestore, 'companies', company.id);
        updateDocumentNonBlocking(companyDocRef, { name });
        
        toast({
            title: "Company Updated",
            description: `Company name has been updated.`
        });
        setIsLoading(false);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Company</DialogTitle>
                    <DialogDescription>
                        Editing details for {company.name}.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Company Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function CompaniesPage() {
    const { claims, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const companiesCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'companies') : null), [firestore]);
    const { data: companies, isLoading } = useCollection<Company>(companiesCollectionRef);
    const [refresher, setRefresher] = React.useState(0);

    const currentUserRole = (claims?.role as Role) || 'Security';

    React.useEffect(() => {
        if(!isUserLoading && currentUserRole !== 'Super Admin') {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.'});
            router.push('/dashboard');
        }
    }, [isUserLoading, currentUserRole, router]);

    const handleCompanyAdded = () => {
        setRefresher(r => r + 1);
    }
    
    if (isUserLoading || currentUserRole !== 'Super Admin') {
        return (
            <div>
                <PageHeader title="Companies" />
                <Card>
                    <CardHeader>
                         <Skeleton className="h-6 w-1/2" />
                         <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div>
        <PageHeader title="Company Management" />
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>All Companies</CardTitle>
                    <CardDescription>
                        Add, view, or manage companies on the platform.
                    </CardDescription>
                </div>
                 <AddCompanyDialog onCompanyAdded={handleCompanyAdded} />
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Company ID</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         Array.from({ length: 3 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : companies?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No companies found. Use the "Add Company" button to create one.
                            </TableCell>
                        </TableRow>
                    ) : (
                        companies?.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={company.logoUrl} />
                                            <AvatarFallback>
                                                <Building />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{company.name}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-muted-foreground">{company.id}</div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <EditCompanyDialog company={company}>
                                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                Edit Company
                                            </DropdownMenuItem>
                                        </EditCompanyDialog>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            disabled
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                            Delete Company
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        </div>
    );
}
