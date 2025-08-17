import Link from "next/link";

export default function Header() {
  return (
    <nav className="header">
      <h1 className="h1"><span className="badge">⚖️</span> Qaadi Live</h1>
      <ul className="nav">
        <li><Link href="/secretary">Secretary</Link></li>
        <li><Link href="/judge">Judge</Link></li>
        <li><Link href="/consultant">Consultant</Link></li>
        <li><Link href="/department-head">Department Head</Link></li>
        <li><Link href="/journalist">Journalist</Link></li>
      </ul>
    </nav>
  );
}
