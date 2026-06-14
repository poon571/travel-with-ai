import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyAuth(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const userInfo = db.prepare('SELECT display_name, profile_pic, custom_api_key, custom_model FROM users WHERE id = ?').get(user.id);
    
    return NextResponse.json({
      display_name: userInfo?.display_name || '',
      profile_pic: userInfo?.profile_pic || '🧑',
      custom_api_key: userInfo?.custom_api_key || '',
      custom_model: userInfo?.custom_model || ''
    });
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyAuth(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const displayName = formData.get('display_name') || '';
    const customApiKey = formData.get('custom_api_key') || '';
    const customModel = formData.get('custom_model') || '';
    let profilePic = formData.get('profile_pic');
    
    const file = formData.get('profile_image');
    if (file && file.size > 0) {
      // Ensure directory exists
      const dirPath = path.join(process.cwd(), 'public', 'uploads', 'profiles');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const filepath = path.join(dirPath, filename);
      fs.writeFileSync(filepath, buffer);
      profilePic = `/uploads/profiles/${filename}`;
    }

    const db = getDb();
    db.prepare('UPDATE users SET display_name = ?, profile_pic = ?, custom_api_key = ?, custom_model = ? WHERE id = ?')
      .run(displayName, profilePic || '🧑', customApiKey, customModel, user.id);
    
    return NextResponse.json({ success: true, profile_pic: profilePic });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
