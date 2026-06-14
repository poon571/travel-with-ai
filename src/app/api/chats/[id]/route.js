import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyAuth(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const chatId = resolvedParams.id;
    const db = getDb();

    // Verify ownership
    const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND user_id = ?').get(chatId, user.id);
    if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const messages = db.prepare('SELECT role, text FROM messages WHERE chat_id = ? ORDER BY id ASC').all(chatId);

    return NextResponse.json({ chat, messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyAuth(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const chatId = resolvedParams.id;
    const db = getDb();

    // Verify ownership
    const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND user_id = ?').get(chatId, user.id);
    if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Delete messages and chat
    db.prepare('DELETE FROM messages WHERE chat_id = ?').run(chatId);
    db.prepare('DELETE FROM chats WHERE id = ?').run(chatId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
