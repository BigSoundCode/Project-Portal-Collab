// app/api/check-user/route.ts
import { NextResponse } from 'next/server';
import { checkUserExists } from 'app/lib/data'; // You'll need to implement this function

export async function POST(request: Request) {
  const { email } = await request.json();

  try {
    const userExists = await checkUserExists(email);
    if (userExists) {
      return NextResponse.json({ exists: true });
    } else {
      return NextResponse.json({ exists: false }, { status: 404 });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}