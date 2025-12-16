
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
};


function RoleSelector({ value, onValueChange, disabled }: { value: Role; onValueChange: (role: Role) => void; disabled?: boolean; }) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as Role)} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
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

    const handleAddUser = async () => {
        if (!auth || !firestore) return;
        setIsLoading(true);
        try {
            // Check if this is the first user
            const membersRef = collection(firestore, 'memberships');
            const snapshot = await getCountFromServer(membersRef);
            const isFirstUser = snapshot.data().count === 0;

            const finalRole = isFirstUser ? 'Admin' : role;

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Set custom claim for the role
            await setRoleFlow({ userId: user.uid, role: finalRole });

            // Also create a member document in Firestore
            const memberDocRef = doc(firestore, 'memberships', user.uid);
            await setDoc(memberDocRef, {
                id: user.uid,
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


            onUserAdded();
            await user.getIdToken(true); // Force refresh of token to get new role

            toast({ title: 'User Created', description: `Successfully created user ${email} with role ${finalRole}.` });
            setIsOpen(false);
            setEmail('');
            setPassword('');
            setFullName('');
            setRole('Receptionist');
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
                        Create a new user and assign them a role. Note: this creates a real Firebase Auth user and a member profile.
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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddUser} disabled={isLoading}>
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
        if (!firestore) return;
        setIsLoading(true);

        const memberDocRef = doc(firestore, 'memberships', user.id);
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
                        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="col-span-3" />
                    </div>
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
                    <Button onClick={handleSaveChanges} disabled={isLoading}>
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
        setIsLoading(true);
        try {
            const { users } = await listAllUsers();
            const userRecords = users.map(u => ({
                id: u.uid,
                email: u.email,
                // The backend flow doesn't return `displayName`, so use `fullName`
                // and provide a fallback to the email.
                fullName: u.fullName || u.email, 
                role: u.role as Role || 'Security' // Fallback for users without a role
            }));
            setUsersWithRoles(userRecords);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to fetch users', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleRoleChange = async (userId: string, newRole: Role) => {
        const originalUsers = [...usersWithRoles];
        const userToUpdate = usersWithRoles.find(u => u.id === userId);
        if (!userToUpdate) return;
        
        // Optimistically update UI
        setUsersWithRoles(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        
        try {
            await setRoleFlow({ userId, role: newRole });
            toast({ title: 'Role Updated', description: `${userToUpdate.email}'s role set to ${newRole}.` });
            // Optionally, re-fetch the user to confirm the change from the source of truth
            await user?.getIdToken(true); // Force refresh current user's token
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Failed to set role", description: error.message || 'Please check server logs.' });
             // Revert optimistic update
            setUsersWithRoles(originalUsers);
        }
    };
    
    const handleRemoveUser = (userId: string, userEmail: string) => {
        // In a real app, you'd call a backend function to delete the user.
        toast({ title: 'User Removed (Simulated)', description: `User ${userEmail} removed from the list. A backend function is needed to delete the actual Firebase user and their data.` });
    };


    return (
        <div>
        <PageHeader title="Authentication & Roles" />
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>User Role Management</CardTitle>
                    <CardDescription>
                        Assign roles to users to control their access. Changes are saved automatically.
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
                                <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : usersWithRoles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No users found. Use the "Add User" button to create one.
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
                                        onValueChange={(role) => handleRoleChange(userRecord.id, role)}
                                        disabled={!permissions[currentUserRole]?.editRole || userRecord.id === user?.uid}
                                    />
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
