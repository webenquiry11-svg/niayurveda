import ClinicalForm from "./Components/ClinicalForm";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 font-sans selection:bg-blue-200 selection:text-blue-900 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-10">
        <Link href="/Admin" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-blue-600 hover:border-blue-300 transition-all">
          Admin Login &rarr;
        </Link>
      </div>
      <ClinicalForm />
    </main>
  );
}