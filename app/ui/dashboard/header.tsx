import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header style={{ backgroundColor: '#042540', color: '#c09f4a' }}>
      <nav>
        
      </nav>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link legacyBehavior href="/dashboard">
          <a>
            <Image src="/TBH_Logo_White_Vertical.png" alt="Logo" width={240} height={44.856} />
          </a>
        </Link>
        <div style={{ borderLeft: '1px solid #c09f4a', height: '50px', margin: '0 10px' }}></div>
        <h1 style={{ fontWeight: 'bold' }}>Customer Portal</h1>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/admin">
          <button style={{ paddingLeft: '10px', paddingRight: '10px' }}>
            <Image src="/menu.png" alt="B1" width={30} height={30}/>
          </button>
          </Link>
          <button style={{ paddingLeft: '10px', paddingRight: '10px' }}>
            <Image src="/user.png" alt="B2" width={30} height={30} />
          </button>
        </div>
      </div>
    </header>
  );
}
