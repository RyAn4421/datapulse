import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export const dynamic = 'force-dynamic';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        // 1. Validate: name required, email format, password >= 8 chars
        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        if (!email || !emailPattern.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }
        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // 2. connectDB()
        await connectDB();

        // 3. Check User.findOne({ email }) — if exists return 409
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
        }

        // 4. hash = await bcrypt.hash(password, 12)
        const hashedPassword = await bcrypt.hash(password, 12);

        // 5. await User.create({ name, email, passwordHash: hash })
        await User.create({ 
            name, 
            email: email.toLowerCase(), 
            passwordHash: hashedPassword,
            role: 'admin' // default role
        });

        // 6. return 201 { success: true }
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}
