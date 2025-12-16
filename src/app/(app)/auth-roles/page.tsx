
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { useAuth, useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { collection, doc, setDoc, Timestamp, getCountFromServer } from 'firebase/firestore';
import { type Member, type MemberStatus, type MemberTier } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { type Role, permissions } from '@/lib/roles';
import { setRole as setRoleFlow } from '@/ai/flows/set-role-flow';
import { listAllUsers } from '@/ai/flows/list-all-users';

type UserRecord = {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    companyId?: string;
};


function RoleSelector({ value, onValueChange, disabled }: { value: Role; onValueChange: (role: Role) => void; disabled?: boolean; }) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as Role)} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Super Admin">Super Admin</SelectItem>
        <SelectItem value="Admin">Admin</SelectItem>
        <SelectItem value="Receptionist">Receptionist</SelectItem>
        <SelectItem value="Manager">Manager</SelectItem>
        <SelectItem value="Security">Security</SelectItem>
      </SelectContent>
    </Select>
  );
}

function AddUserDialog({ onUserAdded, currentUserRole }: { onUserAdded: () => void, currentUserRole: Role }) {
    const auth = useAuth();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fullName, setFullName] = React.useState('');
    const [role, setRole] = React.useState<Role>('Receptionist');
    const [isLoading, setIsLoading] = React.useState(false);
    const [companyId, setCompanyId] = React.useState('');
    
    const companiesCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'companies') : null), [firestore]);
    const { data: companies, isLoading: isLoadingCompanies } = useCollection<{id: string, name: string}>(companiesCollectionRef);


    const handleAddUser = async () => {
        if (!auth || !firestore) return;
        setIsLoading(true);
        try {
            // Determine the role. The very first user ever created becomes a Super Admin.
            const usersSnapshot = await listAllUsers();
            const isFirstUser = usersSnapshot.users.length === 0;
            const finalRole = isFirstUser ? 'Super Admin' : role;
            const finalCompanyId = isFirstUser ? undefined : companyId;

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Set custom claim for the role and company
            await setRoleFlow({ userId: user.uid, role: finalRole, companyId: finalCompanyId });

            // Create a member document for them only if they are NOT a super admin
            if (finalRole !== 'Super Admin' && finalCompanyId) {
                const memberDocRef = doc(firestore, `companies/${finalCompanyId}/memberships`, user.uid);
                await setDoc(memberDocRef, {
                    id: user.uid,
                    companyId: finalCompanyId,
                    email: user.email,
                    fullName: fullName || user.email,
                    tier: 'Bronze' as MemberTier, 
                    points: 0,
                    joinDate: Timestamp.now(),
                    dob: Timestamp.now(),
                    gender: '',
                    nationality: '',
                    governmentId: '',
                    phone: '',
                    address: '',
                    expiryDate: Timestamp.now(),
                    photo: '',
                    idFront: '',
                    idBack: '',
                    status: 'Checked Out' as MemberStatus,
                });
            }

            onUserAdded();
            await user.getIdToken(true); // Force refresh of token to get new role

            toast({ title: 'User Created', description: `Successfully created user ${email} with role ${finalRole}.` });
            setIsOpen(false);
            setEmail('');
            setPassword('');
            setFullName('');
            setRole('Receptionist');
            setCompanyId('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error creating user', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button size="sm" className="ml-auto gap-1" disabled={!permissions[currentUserRole]?.createUser}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add User
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Create a new user and assign them a role and company.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fullName" className="text-right">Full Name</Label>
                        <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Password</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <div className="col-span-3">
                            <RoleSelector value={role} onValueChange={setRole} />
                        </div>
                    </div>
                     {role !== 'Super Admin' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="company" className="text-right">Company</Label>
                            <div className="col-span-3">
                                 <Select value={companyId} onValueChange={setCompanyId} disabled={isLoadingCompanies}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddUser} disabled={isLoading || (role !== 'Super Admin' && !companyId)}>
                        {isLoading ? 'Creating...' : 'Create User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditUserDialog({ user, children }: { user: UserRecord, children: React.ReactNode }) {
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = React.useState(false);
    const [fullName, setFullName] = React.useState(user.fullName);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setFullName(user.fullName);
        }
    }, [isOpen, user.fullName]);
    
    const handleSaveChanges = () => {
        if (!firestore || !user.companyId) return;
        setIsLoading(true);

        const memberDocRef = doc(firestore, `companies/${user.companyId}/memberships`, user.id);
        updateDocumentNonBlocking(memberDocRef, { fullName });
        
        toast({
            title: "User Updated",
            description: `Full name for ${user.email} has been updated.`
        });
        setIsLoading(false);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Editing details for {user.email}.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fullName" className="text-right">Full Name</Label>
                        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="col-span-3" disabled={!user.companyId} />
                    </div>
                     {!user.companyId && <p className="text-sm text-muted-foreground text-center col-span-4">Super Admins do not have an editable profile here.</p>}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Password</Label>
                        <div className='col-span-3'>
                            <Button variant="outline" size="sm" disabled>Send Password Reset</Button>
                            <p className="text-xs text-muted-foreground mt-1">Password changes require a backend function.</p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isLoading || !user.companyId}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function AuthRolesPage() {
    const { user, claims, isUserLoading } = useUser();
    const [usersWithRoles, setUsersWithRoles] = React.useState<UserRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const currentUserRole = (claims?.role as Role) || 'Security';

    const fetchUsers = React.useCallback(async () => {
        // Only Super Admins should be able to list all users
        if (currentUserRole !== 'Super Admin') {
            setIsLoading(false);
            setUsersWithRoles([]);
            return;
        }

        setIsLoading(true);
        try {
            const { users } = await listAllUsers();
            const userRecords = users.map(u => ({
                id: u.uid,
                email: u.email,
                fullName: u.fullName || u.email, 
                role: u.role as Role || 'Security',
                companyId: u.companyId,
            }));
            setUsersWithRoles(userRecords);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to fetch users', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [currentUserRole]);

    React.useEffect(() => {
        if (!isUserLoading) {
            fetchUsers();
        }
    }, [fetchUsers, isUserLoading]);
    
    const handleRoleChange = async (userId: string, newRole: Role, companyId?: string) => {
        const originalUsers = [...usersWithRoles];
        const userToUpdate = usersWithRoles.find(u => u.id === userId);
        if (!userToUpdate) return;
        
        setUsersWithRoles(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        
        try {
            await setRoleFlow({ userId, role: newRole, companyId });
            toast({ title: 'Role Updated', description: `${userToUpdate.email}'s role set to ${newRole}.` });
            await user?.getIdToken(true);
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Failed to set role", description: error.message || 'Please check server logs.' });
            setUsersWithRoles(originalUsers);
        }
    };
    
    const handleRemoveUser = (userId: string, userEmail: string) => {
        toast({ title: 'User Removed (Simulated)', description: `User ${userEmail} removed. Backend function needed to delete user.` });
    };

    if (currentUserRole !== 'Super Admin' && !isUserLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You do not have permission to manage users. This page is for Super Admins only.</p>
                </CardContent>
            </Card>
        )
    }


    return (
        <div>
        <PageHeader title="Authentication & Roles" />
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>User Role Management</CardTitle>
                    <CardDescription>
                        Assign roles and companies to users. Changes are saved automatically.
                    </CardDescription>
                </div>
                 <AddUserDialog onUserAdded={fetchUsers} currentUserRole={currentUserRole} />
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>User (Name/Email)</TableHead>
                    <TableHead>Role</TableHead>
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
                                <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-[180px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : usersWithRoles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No users found. Use the "Add User" button to create the first Super Admin.
                            </TableCell>
                        </TableRow>
                    ) : (
                        usersWithRoles.map((userRecord) => (
                            <TableRow key={userRecord.id}>
                                <TableCell>
                                    <div className="font-medium">{userRecord.fullName}</div>
                                    <div className="text-sm text-muted-foreground">{userRecord.email}</div>
                                </TableCell>
                                <TableCell>
                                    <RoleSelector
                                        value={userRecord.role}
                                        onValueChange={(role) => handleRoleChange(userRecord.id, role, userRecord.companyId)}
                                        disabled={!permissions[currentUserRole]?.editRole || userRecord.id === user?.uid}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-muted-foreground">{userRecord.companyId || 'N/A'}</div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={userRecord.id === user?.uid}>
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <EditUserDialog user={userRecord}>
                                             <DropdownMenuItem
                                                onSelect={(e) => e.preventDefault()}
                                                disabled={!permissions[currentUserRole]?.editUser}
                                             >
                                                Edit User
                                            </DropdownMenuItem>
                                        </EditUserDialog>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleRemoveUser(userRecord.id, userRecord.email)}
                                            disabled={!permissions[currentUserRole]?.deleteUser}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                            Remove User
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
