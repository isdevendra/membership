
export type Role = 'Admin' | 'Receptionist' | 'Manager' | 'Security' | 'Member';

export const permissions: Record<Role, { createUser: boolean; deleteUser: boolean; editRole: boolean; editUser: boolean; viewReports: boolean; }> = {
    Admin: { createUser: true, deleteUser: true, editRole: true, editUser: true, viewReports: true },
    Manager: { createUser: true, deleteUser: false, editRole: false, editUser: true, viewReports: true },
    Receptionist: { createUser: true, deleteUser: false, editRole: false, editUser: false, viewReports: false },
    Security: { createUser: false, deleteUser: false, editRole: false, editUser: false, viewReports: false },
    Member: { createUser: false, deleteUser: false, editRole: false, editUser: false, viewReports: false },
};

// For now, we'll assume the current user is an Admin for demonstration purposes.
export const currentUserRole: Role = 'Admin';
