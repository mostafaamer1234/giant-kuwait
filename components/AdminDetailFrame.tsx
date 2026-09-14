import Link from "next/link";
import Image from "next/image";

export function AdminDetailFrame({
  section,
  title,
  eyebrow,
  children,
}: {
  section: "Orders" | "Customers" | "Promotions" | "Payments" | "Settings";
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <main className="admin-detail-page">
      <aside>
        <Link href="/admin" className="admin-brand"><Image src="/giant-logo-on-white.jpg" alt="GIANT" width={416} height={281}/><b>GIANT / OPS</b></Link>
        <Link href="/admin">Overview</Link>
        <Link className={section === "Orders" ? "active" : ""} href="/admin?tab=Orders">Orders</Link>
        <Link className={section === "Customers" ? "active" : ""} href="/admin?tab=Customers">Customers</Link>
        <Link className={section === "Promotions" ? "active" : ""} href="/admin?tab=Promotions">Promotions</Link>
        <Link className={section === "Payments" ? "active" : ""} href="/admin?tab=Payments">Payments</Link>
        <Link className={section === "Settings" ? "active" : ""} href="/admin?tab=Settings">Settings</Link>
      </aside>
      <section>
        <nav className="detail-breadcrumb"><Link href={`/admin?tab=${section}`}>← {section}</Link><span>/</span><b>{title}</b></nav>
        <header className="detail-header"><div><p>{eyebrow}</p><h1>{title}</h1></div><Link href={`/admin?tab=${section}`}>CLOSE ×</Link></header>
        {children}
      </section>
    </main>
  );
}

export const adminMoney = (fils: number) => new Intl.NumberFormat("en-KW", {style:"currency",currency:"KWD",minimumFractionDigits:3}).format(fils / 1000);
