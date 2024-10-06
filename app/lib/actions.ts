'use server';

import { authOptions } from '@/auth';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session) {
      // User is already authenticated
      redirect('/dashboard');
    }

    // If not authenticated, redirect to the Azure AD sign-in page
    redirect('/api/auth/signin/azure-ad');

  } catch (error) {
    // Since AuthError is not exported, we'll use a type guard instead
    if (error && typeof error === 'object' && 'type' in error) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    console.error('Authentication error:', error);
    return 'An unexpected error occurred.';
  }
}