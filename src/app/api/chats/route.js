import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyAuth(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const chats = db.prepare('SELECT id, title, created_at FROM chats WHERE user_id = ? ORDER BY id DESC').all(user.id);

    return NextResponse.json({ chats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyAuth(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title } = await req.json();
    const db = getDb();
    
    const stmt = db.prepare('INSERT INTO chats (user_id, title) VALUES (?, ?)');
    const info = stmt.run(user.id, title || 'แชทใหม่');

    return NextResponse.json({ id: info.lastInsertRowid, title: title || 'แชทใหม่' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
