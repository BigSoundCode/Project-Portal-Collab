import AcmeLogo from '@/app/ui/acme-logo';
import LoginForm from '@/app/ui/login-form';
import Image from 'next/image';
 
export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end  p-3 md:h-36">
          <div>
            <Image src="/logoWhite.png" alt="Acme Logo" width={442} height={180} />
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}