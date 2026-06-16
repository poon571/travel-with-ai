import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function DELETE(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyAuth(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();

    // Start a transaction to ensure all or nothing is deleted
    const deleteUserTransaction = db.transaction((userId) => {
      // 1. Delete all messages for chats belonging to the user
      db.prepare(`
        DELETE FROM messages 
        WHERE chat_id IN (SELECT id FROM chats WHERE user_id = ?)
      `).run(userId);

      // 2. Delete all chats belonging to the user
      db.prepare('DELETE FROM chats WHERE user_id = ?').run(userId);

      // 3. Delete the user profile
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    // Execute the transaction
    deleteUserTransaction(user.id);

    // 4. Clear the auth cookie
    cookieStore.delete('auth_token');

    return NextResponse.json({ success: true, message: 'User data and account successfully deleted.' });
  } catch (error) {
    console.error('Delete User Error:', error);
    return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
  }
}
