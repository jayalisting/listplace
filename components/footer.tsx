import Link from "next/link"
import Image from "next/image"

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-gray-400 py-12 border-t border-rose-900/30">
      <div className="container mx-auto px-4 text-center space-y-6">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center space-x-2.5 justify-center group">
          <div className="relative w-9 h-9 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="JayaListing Royal Emblem"
              width={36}
              height={36}
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="text-xl font-black bg-gradient-to-r from-rose-400 via-red-300 to-rose-400 bg-clip-text text-transparent">
            JayaListing Royal Estates
          </div>
        </Link>

        {/* Operating City Hubs */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
          <span className="text-rose-400 uppercase tracking-wider text-[11px]">Operating Hubs:</span>
          <Link href="/?city=bengaluru" className="hover:text-amber-400 transition-colors">
            Bengaluru (₹5 Cr+)
          </Link>
          <span>•</span>
          <Link href="/?city=mangaluru" className="hover:text-amber-400 transition-colors">
            Mangaluru &amp; DK (₹5 Cr+)
          </Link>
          <span>•</span>
          <Link href="/?city=udupi" className="hover:text-amber-400 transition-colors">
            Udupi &amp; Manipal (₹5 Cr+)
          </Link>
          <span>•</span>
          <Link href="/?city=mumbai" className="hover:text-amber-400 transition-colors">
            Mumbai (Staged Private Desk)
          </Link>
          <span>•</span>
          <a
            href="https://wa.me/918296530609?text=Hello%20JayaListing%20Private%20Desk%2C%20I%20would%20like%20to%20share%20a%20property%20acquisition%20requirement"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 transition-colors font-bold"
          >
            Share Acquisition Requirement
          </a>
        </div>

        {/* Categories Link Row - In Strict Order */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-400">
          <Link href="/residential" className="hover:text-blue-400 transition-colors">
            1. Residential Mansions
          </Link>
          <Link href="/commercial" className="hover:text-amber-400 transition-colors">
            2. Commercial Towers
          </Link>
          <Link href="/industrial" className="hover:text-purple-400 transition-colors">
            3. Industrial Logistics
          </Link>
          <Link href="/agriculture" className="hover:text-emerald-400 transition-colors">
            4. Agricultural Farmlands
          </Link>
          <a href="tel:+918296530609" className="hover:text-amber-400 transition-colors">
            Private Client Desk: +91 82965 30609
          </a>
        </div>

        {/* Regulatory & RERA Assurance */}
        <div className="text-[11px] text-slate-400 max-w-3xl mx-auto space-y-1">
          <p>
            Karnataka RERA: <strong className="text-slate-300">PRM/KA/RERA/1251/310/PR/171015/000456</strong> | Maharashtra MahaRERA Advisory
          </p>
          <p className="text-slate-400">
            JayaListing represents institutional &amp; private client portfolios exclusively exceeding ₹5 Crore. All acquisitions are subject to independent title search reports, zoning verification, and formal legal due diligence.
          </p>
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-400 pt-2 border-t border-slate-900">
          &copy; {new Date().getFullYear()} JayaListing. Private Client Portfolio. Strictly Confidential &amp; Vetted Titles.
        </p>
      </div>
    </footer>
  )
}

export default Footer
