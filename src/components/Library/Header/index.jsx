import Link from "next/link";
export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full p-2 z-12 flex justify-start items-center gap-2">
      <span>
        <Link href="/">Home</Link>
      </span>
      <span>
        <Link href="/year">Years</Link>
      </span>
    </header>
  );
}
