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
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';


// This is placeholder data. We will connect this to live Firebase Auth users later.
const initialUsers = [
  { id: 'user1', email: 'admin@example.com', role: 'Admin' },
  { id: 'user2', email: 'reception@example.com', role: 'Receptionist' },
  { id: 'user3', email: 'manager@example.com', role: 'Manager' },
  { id: 'user4', email: 'security@example.com', role: 'Security' },
  { id: 'user5', email: 'jane.doe@example.com', role: 'Member' },
];

type Role = 'Admin' | 'Receptionist' | 'Manager' | 'Security' | 'Member';

const permissions: Record<Role, { createUser: boolean; deleteUser: boolean; editRole: boolean; }> = {
    Admin: { createUser: true, deleteUser: true, editRole: true },
    Manager: { createUser: false, deleteUser: false, editRole: false },
    Receptionist: { createUser: false, deleteUser: false, editRole: false },
    Security: { createUser: false, deleteUser: false, editRole: false },
    Member: { createUser: false, deleteUser: false, editRole: false },
};

// For now, we'll assume the current user is an Admin for demonstration purposes.
const currentUserRole: Role = 'Admin';


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
        <SelectItem value="Member">Member</SelectItem>
      </SelectContent>
    </Select>
  );
}

function AddUserDialog({ onUserAdded }: { onUserAdded: (user: any) => void }) {
    const auth = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [role, setRole] = React.useState<Role>('Member');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleAddUser = async () => {
        if (!auth) return;
        setIsLoading(true);
        try {
            // In a real app, you'd want to use a more secure way to create users,
            // like a backend function, to avoid exposing auth logic on the client.
            // This is a temporary user for demonstration purposes.
            const tempAuth = auth; // This is not ideal.
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newUser = { id: userCredential.user.uid, email: userCredential.user.email!, role };
            onUserAdded(newUser);
            // In a real app, you'd set the custom claim for the role on the backend here.
            toast({ title: 'User Created', description: `Successfully created user ${email}.` });
            setIsOpen(false);
            setEmail('');
            setPassword('');
            setRole('Member');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error creating user', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button size="sm" className="ml-auto gap-1" disabled={!permissions[currentUserRole].createUser}>
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
                        Create a new user and assign them a role. They will receive an email to set up their account.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
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

export default function AuthRolesPage() {
    const [users, setUsers] = React.useState(initialUsers);

    const [userRoles, setUserRoles] = React.useState<Record<string, Role>>(
        users.reduce((acc, user) => ({ ...acc, [user.id]: user.role as Role }), {})
    );

    const handleRoleChange = (userId: string, role: Role) => {
        setUserRoles(prev => ({ ...prev, [userId]: role }));
        // In a real app, you would call a function here to update the user's role.
        toast({ title: "Role ready to save", description: `New role for user is set to ${role}. Click 'Save Changes' in the menu.`})
    };
    
    const handleUserAdded = (newUser: any) => {
        setUsers(prev => [...prev, newUser]);
        setUserRoles(prev => ({ ...prev, [newUser.id]: newUser.role }));
    };

    return (
        <div>
        <PageHeader title="Authentication & Roles" />
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>User Role Management</CardTitle>
                    <CardDescription>
                        Assign roles to users to control their access to different parts of the application.
                    </CardDescription>
                </div>
                 <AddUserDialog onUserAdded={handleUserAdded} />
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>User Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                            <RoleSelector
                                value={userRoles[user.id]}
                                onValueChange={(role) => handleRoleChange(user.id, role)}
                                disabled={!permissions[currentUserRole].editRole}
                            />
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
                                <DropdownMenuItem>Save Changes</DropdownMenuItem>
                                <DropdownMenuItem disabled={!permissions[currentUserRole].deleteUser}>Remove User</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        </div>
    );
}
