'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { NavBar } from '@/components/ui/nav-bar';
import { UserFormDialog } from '@/components/Forms/user/user-form';


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setCurrentUserRole(JSON.parse(stored).role);
    }
  }, []);
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<User[]>('/users');
      setUsers(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  return (
    <>
      <NavBar />
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Users</h1>
          {currentUserRole === 'ADMIN' && (
            <Button onClick={openCreateDialog}>+ New User</Button>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active Customers</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.activeCustomerCount ?? 0} / 5</TableCell>
                  <TableCell>
                    {currentUserRole === 'ADMIN' && (
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(u)}>
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <UserFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={editingUser}
          onSuccess={fetchUsers}
        />
      </div>
    </>
  );
}