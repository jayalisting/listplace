export interface PropertyFaqItem {
  question: string
  answer: string
}

export interface LuxuryProperty {
  id: string
  title: string
  tagline: string
  category: "residential" | "commercial" | "industrial" | "agriculture"
  propertyType: string
  price: string
  originalPrice?: string
  priceNumeric: number
  priceSuffix?: string
  location: string
  city: string
  state: string
  area: string
  carpetArea?: string
  bedrooms?: number
  bathrooms?: number
  parking: string
  facing?: string
  floor?: string
  age?: string
  status: "For Sale" | "For Lease" | "Private Treaty"
  listingType: "sell" | "rent" | "lease"
  rating: number
  reviews: number
  isNew?: boolean
  isExclusive?: boolean
  isTrophy?: boolean
  tags: string[]
  images: string[]
  description: string
  highlights: string[]
  amenities?: string[]
  customFaqs?: PropertyFaqItem[]
  displayOrder?: number
  featuredHome?: boolean
  subType?: string | null
  purpose?: string | null
  ownership?: string | null
  visibility?: "public" | "gated" | "private"
  strengthScore?: number
  verificationTier?: "verified" | "site_visited" | "document_verified" | "documents_verified" | "top_tier" | "standard"
  attributes?: Record<string, any>
  facilities?: any[]
  documents?: any[]
  details: {
    bedrooms?: number | string
    bathrooms?: number | string
    area: string
    carpet?: string
    parking: string
    furnished?: string
    facing?: string
    floor?: string
    age?: string
    electricity?: string
    water?: string
    security?: string
    capacity?: string
    powerBackup?: string
    zoning?: string
    ceilingHeight?: string
    soilType?: string
    crops?: string
    waterSource?: string
    connectivity?: string
  }
  landmarks: {
    name: string
    type: string
    distance: string
    color: string
  }[]
  seller: {
    name: string
    title: string
    phone: string
    email: string
    avatar: string
    verified: boolean
    portfolioCount: number
  }
  roi?: string
  coordinates: {
    lat: number
    lng: number
  }
}

export const LUXURY_PROPERTIES: LuxuryProperty[] = [
  // ==========================================
  // 1. RESIDENTIAL ESTATES & PENTHOUSES
  // ==========================================
  {
    id: "1",
    title: "The Imperial Sky Penthouse",
    tagline: "Unobstructed 360° Arabian Sea Panoramas & Private Helipad Access",
    category: "residential",
    propertyType: "Duplex Penthouse",
    price: "₹48.5 Cr",
    originalPrice: "₹52.0 Cr",
    priceNumeric: 48.5,
    location: "Altamount Road, Billionaires' Row, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    area: "6,800 sq ft",
    carpetArea: "6,150 sq ft",
    bedrooms: 5,
    bathrooms: 6,
    parking: "5 Dedicated Covered Bays",
    facing: "North-West (Sea Facing)",
    floor: "42nd & 43rd Floor (Triplex Sky Terrace)",
    age: "Brand New Ready to Move",
    status: "For Sale",
    listingType: "sell",
    rating: 4.95,
    reviews: 28,
    isNew: true,
    isExclusive: true,
    isTrophy: true,
    tags: ["Sea View", "Private Infinity Pool", "Private Lift", "Concierge 24/7", "Italian Statuario Marble"],
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "Perched on Mumbai's most prestigious Billionaires' Row on Altamount Road, this bespoke 6,800 sq ft sky penthouse represents the pinnacle of international luxury. Offering private biometric elevator access opening directly into a double-height foyer, floor-to-ceiling sound-attenuated Belgian glass, heated cantilevered infinity pool overlooking the Arabian Sea, temperature-regulated wine cellar, soundproof screening theater, and dedicated butler quarters. Fully automated with Savant smart home controls, custom Poliform cabinetry, and book-matched Italian Statuario marble throughout.",
    highlights: [
      "Private cantilevered infinity edge pool suspended over Mumbai skyline",
      "Direct biometric elevator access to both levels",
      "Double-height 22-foot grand reception with panoramic Arabian Sea sunset views",
      "Temperature-controlled 300-bottle walk-in wine cellar & tasting lounge",
      "Staff quarters with separate service elevator & chef preparation kitchen",
      "5 automated multi-car parking bays with private EV ultra-chargers",
    ],
    details: {
      bedrooms: "5 En-Suite Master Bedrooms",
      bathrooms: "6 Spa-Inspired Baths + Powder Room",
      area: "6,800 sq ft",
      carpet: "6,150 sq ft",
      parking: "5 Covered Automated Bays",
      furnished: "Bespoke Designer Furnished (Poliform / Minotti)",
      facing: "North-West (Arabian Sea)",
      floor: "42nd & 43rd Floor Duplex",
      age: "Brand New (Never Occupied)",
      electricity: "Dual 100% DG Backups + Private Solar",
      water: "Dedicated 24/7 Treated Hydro-Pneumatic",
      security: "Triple-Layer Biometric + 24/7 Elite Armed Guard",
    },
    landmarks: [
      { name: "Private Helipad (Willingdon)", type: "helipad", distance: "1.2 km", color: "bg-blue-100 text-blue-700" },
      { name: "Breach Candy Hospital", type: "hospital", distance: "0.8 km", color: "bg-red-100 text-red-700" },
      { name: "Taj Mahal Palace & Yacht Club", type: "lifestyle", distance: "4.5 km", color: "bg-amber-100 text-amber-700" },
      { name: "Palladium & Luxury Mall", type: "shopping", distance: "2.8 km", color: "bg-purple-100 text-purple-700" },
    ],
    seller: {
      name: "Rohit Singhania",
      title: "Senior VP, JayaListing Royal Portfolio",
      phone: "+91 82965 30609",
      email: "rohit.singhania@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 15,
    },
    roi: "8.4% Projected Annual Appreciation",
    coordinates: { lat: 18.9696, lng: 72.8081 },
  },

  {
    id: "2",
    title: "The Waves Waterfront Oceanfront Villa",
    tagline: "Exclusive Coastal Sanctuary with Private Shore Access & Helipad Lawn",
    category: "residential",
    propertyType: "Waterfront Villa",
    price: "₹14.8 Cr",
    originalPrice: "₹16.5 Cr",
    priceNumeric: 14.8,
    location: "Kadri Hills / Panambur Oceanfront, Mangalore (DK)",
    city: "Mangalore",
    state: "Karnataka",
    area: "8,500 sq ft",
    carpetArea: "7,800 sq ft",
    bedrooms: 6,
    bathrooms: 7,
    parking: "6 Covered Bays + 8 Guest Stalls",
    facing: "West (Direct Sunset & Ocean View)",
    floor: "G + 2 Independent Architectural Masterpiece",
    age: "1 Year Old (Pristine)",
    status: "For Sale",
    listingType: "sell",
    rating: 4.9,
    reviews: 19,
    isNew: false,
    isExclusive: true,
    isTrophy: true,
    tags: ["Direct Sea Access", "Infinity Pool", "Private Helipad Lawn", "Lush Coconut Grove", "Solar Off-Grid", "DK", "Dakshina Kannada"],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "A once-in-a-generation oceanfront estate sprawling across an acre of manicured lawns along the Arabian coastline in Mangalore. Designed by acclaimed tropical modernist architects, this compound features 8,500 sq ft of indoor-outdoor living, an olympic-sized infinity pool blending into the horizon, private beach gate, landscaped helipad-ready lawns, gym & wellness spa, teak woodwork, and smart home automation throughout.",
    highlights: [
      "Direct Sea Access",
      "Infinity Pool",
      "Private Helipad Lawn",
      "Lush Coconut Grove",
      "Solar Off-Grid"
    ],
    details: {
      bedrooms: "6 Luxury Suites with Walk-in Closets",
      bathrooms: "7 Ensuite Baths with Open-Air Tropical Showers",
      area: "8,500 sq ft (Built-Up)",
      carpet: "7,800 sq ft (On 1.2 Acres Land)",
      parking: "6 Covered Bays + Private Driveway",
      furnished: "Fully Furnished with Imported Balinese & Italian Decor",
      facing: "West (Ocean Sunset)",
      floor: "Ground + 2 Floors",
      age: "1 Year Old",
      electricity: "Solar 25kW + Dual Silent Generators",
      water: "Private Deep Borewells + High-Cap RO Purification",
      security: "Perimeter Infrared + Gated Guardhouse",
    },
    landmarks: [
      { name: "Mangalore International Airport", type: "airport", distance: "11.5 km", color: "bg-blue-100 text-blue-700" },
      { name: "Mangalore Club & Marina", type: "club", distance: "4.2 km", color: "bg-amber-100 text-amber-700" },
      { name: "City Centre Mall", type: "shopping", distance: "4.0 km", color: "bg-purple-100 text-purple-700" },
    ],
    seller: {
      name: "Rohit Singhania",
      title: "Senior VP, JayaListing Royal Portfolio",
      phone: "+91 82965 30609",
      email: "rohit.singhania@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 15,
    },
    roi: "12% Capital Growth via Coastal Highway Corridor",
    coordinates: { lat: 12.9141, lng: 74.856 },
  },

  {
    id: "3",
    title: "The Sovereign Golf Greens Villa",
    tagline: "Overlooking PGA Standard Fairways with Private Wine Cellar & Heated Pool",
    category: "residential",
    propertyType: "Golf Course Villa",
    price: "₹24.0 Cr",
    originalPrice: "₹26.5 Cr",
    priceNumeric: 24.0,
    location: "Windmills Enclave, Whitefield, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    area: "9,200 sq ft",
    carpetArea: "8,400 sq ft",
    bedrooms: 5,
    bathrooms: 6,
    parking: "4 Basement Bays with EV Fast Charging",
    facing: "East (Vastu Compliant)",
    floor: "Triplex Villa with Rooftop Terrace",
    age: "Brand New Construction",
    status: "For Sale",
    listingType: "sell",
    rating: 4.92,
    reviews: 24,
    isNew: true,
    isExclusive: true,
    isTrophy: true,
    tags: ["Golf Course View", "Heated Pool", "Private Cinema", "Home Automation", "Bespoke Landscaping"],
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "A grand 9,200 sq ft triplex villa within an ultra-exclusive gated enclave overlooking championship golf fairways. Features a state-of-the-art 12-seater Dolby Atmos private theater, temperature-controlled indoor heated lap pool, personal gymnasium, automated louvers, and a private landscaped Zen garden.",
    highlights: [
      "Direct fairway frontage with panoramic green views from all suites",
      "Dolby Atmos certified 12-recliner acoustic private cinema",
      "Private climate-controlled wine tasting cellar for 500 bottles",
      "Crestron home automation for lighting, climate, music, and security",
    ],
    details: {
      bedrooms: "5 En-Suite Master Suites",
      bathrooms: "6 Luxury Bathrooms",
      area: "9,200 sq ft",
      carpet: "8,400 sq ft",
      parking: "4 Covered Bays",
      furnished: "Semi-Furnished with Bespoke Millwork",
      facing: "East (Morning Sun)",
      floor: "Triplex G + 2",
      age: "Brand New",
      electricity: "100% Redundant Power Grid Backup",
      water: "Rainwater Harvesting + Softener Plant",
      security: "Biometric + Gated Elite Patrol",
    },
    landmarks: [
      { name: "Prestige Tech Park", type: "tech", distance: "3.5 km", color: "bg-blue-100 text-blue-700" },
      { name: "Taj Vivanta Whitefield", type: "hotel", distance: "1.8 km", color: "bg-amber-100 text-amber-700" },
    ],
    seller: {
      name: "Pooja Hegde",
      title: "Senior Partner, Prime Bangalore Portfolio",
      phone: "+91 99001 55678",
      email: "pooja.hegde@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 22,
    },
    roi: "9.8% Annual ROI with Premium Rental Demand",
    coordinates: { lat: 12.9698, lng: 77.75 },
  },

  // ==========================================
  // 2. COMMERCIAL TROPHY ASSETS & HEADQUARTERS
  // ==========================================
  {
    id: "4",
    title: "The Sovereign Financial Tower (Full Floor)",
    tagline: "Iconic Grade-A LEED Platinum Headquarters Floor with Private Helipad",
    category: "commercial",
    propertyType: "Trophy Commercial Headquarters",
    price: "₹85.0 Cr",
    originalPrice: "₹92.0 Cr",
    priceNumeric: 85.0,
    priceSuffix: "or ₹32 Lakh/month lease",
    location: "Bandra-Kurla Complex (G-Block), Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    area: "24,500 sq ft",
    carpetArea: "21,200 sq ft",
    parking: "28 Reserved Executive Basement Bays",
    facing: "East-West Dual Exposure",
    floor: "Top Floor Executive Penthouse Suite (Level 26)",
    age: "2 Years Old",
    status: "For Sale",
    listingType: "sell",
    rating: 4.96,
    reviews: 14,
    isNew: false,
    isExclusive: true,
    isTrophy: true,
    tags: ["Grade A+", "LEED Platinum", "Executive Helipad", "Private Boardrooms", "High Cap Rate 8.8%"],
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "A trophy institutional asset situated in the crown jewel of Indian finance — G-Block BKC. Occupying the entire top level of a LEED Platinum rated glass monolith, this space includes dedicated high-speed destination elevators, private CEO boardroom overlooking Mumbai, terrace garden, and helipad flight privileges.",
    highlights: [
      "Sole occupancy of Level 26 with private rooftop entertainment deck",
      "8 high-speed biometric destination-controlled Otis elevators",
      "LEED Platinum certified with 40% lower operational energy footprint",
      "Dedicated high-security executive helipad access atop the tower",
      "Pre-leased or vacant possession options with 8.8% gross yield potential",
    ],
    details: {
      area: "24,500 sq ft Super Built-up",
      carpet: "21,200 sq ft Carpet",
      parking: "28 Basement Executive Spaces",
      capacity: "250+ Workstations + 12 C-Suite Boardrooms",
      ceilingHeight: "14.5 ft Floor-to-Ceiling Clear Height",
      powerBackup: "100% N+1 Redundant Substation + UPS",
      zoning: "Commercial Office / Financial Services",
      security: "Bespoke 24/7 Command Center & Biometric Flap Barriers",
      age: "2 Years",
    },
    landmarks: [
      { name: "Bharat Diamond Bourse", type: "finance", distance: "0.4 km", color: "bg-blue-100 text-blue-700" },
      { name: "Jio World Convention Centre", type: "event", distance: "0.6 km", color: "bg-purple-100 text-purple-700" },
    ],
    seller: {
      name: "Vikramaditya Oberoi",
      title: "Managing Director, Institutional Real Estate",
      phone: "+91 98201 99000",
      email: "vikram.oberoi@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 31,
    },
    roi: "8.8% Cap Rate with Blue-Chip MNC Lease Potential",
    coordinates: { lat: 19.0657, lng: 72.868 },
  },

  {
    id: "5",
    title: "The Regal Luxury Retail Flagship",
    tagline: "Prime High-Street Retail Frontage with Triple-Height Glass Atrium",
    category: "commercial",
    propertyType: "High-End Retail Flagship",
    price: "₹38.0 Cr",
    priceNumeric: 38.0,
    priceSuffix: "or ₹18 Lakh/month lease",
    location: "Vittal Mallya Road / UB City vicinity, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    area: "14,000 sq ft",
    carpetArea: "12,600 sq ft",
    parking: "16 Dedicated Valet Bays",
    facing: "Main Boulevard Corner Facing",
    floor: "Ground + Mezzanine + 1st Level",
    age: "Newly Built",
    status: "For Sale",
    listingType: "sell",
    rating: 4.88,
    reviews: 11,
    isNew: true,
    isExclusive: true,
    isTrophy: true,
    tags: ["High Street Corner", "Triple Height Glass", "Valet Parking", "Luxury Brands Corridor", "High Footfall"],
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "A flagship luxury retail showroom positioned along Bangalore's most affluent boulevard. Boasting 90 feet of continuous glass frontage, 28-foot ceiling clearance, dedicated valet drop-off zone, and high footfall of ultra-high-net-worth patrons.",
    highlights: [
      "90 feet of unobstructed high-street glass facade for maximum brand visibility",
      "Triple-height 28-ft central atrium suitable for grand chandeliers and displays",
      "Dedicated VIP customer valet portico and private basement parking",
    ],
    details: {
      area: "14,000 sq ft",
      carpet: "12,600 sq ft",
      parking: "16 Valet Bays",
      capacity: "Up to 500 visitors simultaneously",
      ceilingHeight: "28 ft Triple-Height Atrium",
      powerBackup: "100% Uninterrupted Power Supply",
      zoning: "Commercial High-Street Retail",
      security: "24/7 Guarded Perimeter & HD Surveillance",
      age: "Brand New Ready for Fitout",
    },
    landmarks: [
      { name: "UB City Luxury Mall", type: "shopping", distance: "0.2 km", color: "bg-purple-100 text-purple-700" },
      { name: "The Ritz-Carlton", type: "hotel", distance: "0.4 km", color: "bg-amber-100 text-amber-700" },
    ],
    seller: {
      name: "Pooja Hegde",
      title: "Senior Partner, Prime Bangalore Portfolio",
      phone: "+91 99001 55678",
      email: "pooja.hegde@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 22,
    },
    roi: "9.5% High Yield from Luxury Global Brand Tenants",
    coordinates: { lat: 12.9716, lng: 77.5946 },
  },

  // ==========================================
  // 3. INDUSTRIAL LOGISTICS & MEGA HUBS
  // ==========================================
  {
    id: "6",
    title: "The Gateway Automated Logistics Park",
    tagline: "Grade-A Pre-Engineered Mega Facility with 18 Hydraulic Docks & Bonded Status",
    category: "industrial",
    propertyType: "Grade-A Industrial Campus",
    price: "₹68.0 Cr",
    priceNumeric: 68.0,
    priceSuffix: "or ₹34 Lakh/month lease",
    location: "Bhiwandi / Mumbai-Nashik Expressway Corridor, Maharashtra",
    city: "Mumbai Region",
    state: "Maharashtra",
    area: "140,000 sq ft",
    carpetArea: "135,000 sq ft",
    parking: "40 Multi-Axle Trailer Bays + 50 Staff Parking",
    facing: "Main Expressway Toll Frontage",
    floor: "Single-Span PEB Structure (12m Clear Height)",
    age: "Brand New Ready for Commissioning",
    status: "For Sale",
    listingType: "sell",
    rating: 4.91,
    reviews: 16,
    isNew: true,
    isExclusive: true,
    isTrophy: true,
    tags: ["Grade-A PEB", "12m Clear Height", "18 Hydraulic Docks", "FM2 Laser Screed Floor", "Bonded Warehouse License"],
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "A flagship Grade-A logistics facility purpose-built to international supply chain standards. Featuring 12-meter clear height, FM2 laser-screed flooring with 7-ton point load capacity, 18 automated hydraulic dock levelers with canopies, NFPA compliant early suppression fast response (ESFR) sprinklers, and dedicated administrative offices.",
    highlights: [
      "140,000 sq ft clear-span warehouse with zero internal column interference",
      "FM2 heavy-duty flooring certified for very narrow aisle (VNA) robotic forklifts",
      "18 motorized dock levelers with dock seals for all-weather loading",
      "Direct signal-free connectivity to JNPT Container Terminal and Mumbai Expressway",
    ],
    details: {
      area: "140,000 sq ft",
      carpet: "135,000 sq ft",
      ceilingHeight: "12 Meters (39.4 ft) Clear Height",
      parking: "40 Multi-Axle Trailer Bays",
      connectivity: "Direct 8-Lane Expressway Frontage",
      powerBackup: "Dedicated 3.5 MVA Industrial Feeder + Backup",
      zoning: "Heavy Industrial / Logistics Park",
      security: "Automated Boom Barriers, Weighbridge, 24/7 CCTV Network",
      age: "Brand New 2024",
    },
    landmarks: [
      { name: "Mumbai-Nashik Expressway", type: "highway", distance: "0.2 km", color: "bg-blue-100 text-blue-700" },
      { name: "JNPT Container Port", type: "port", distance: "52 km", color: "bg-emerald-100 text-emerald-700" },
    ],
    seller: {
      name: "Vikramaditya Oberoi",
      title: "Managing Director, Institutional Real Estate",
      phone: "+91 98201 99000",
      email: "vikram.oberoi@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 31,
    },
    roi: "9.4% Gross Institutional Yield with 15-Year Lease Guarantee",
    coordinates: { lat: 19.297, lng: 73.063 },
  },

  {
    id: "7",
    title: "The Coastal Clean-Tech Industrial Mega Complex",
    tagline: "Heavy Industrial Plant with Deep-Water Seaport Proximity & 5 MVA Power",
    category: "industrial",
    propertyType: "Heavy Industrial Facility",
    price: "₹34.0 Cr",
    priceNumeric: 34.0,
    priceSuffix: "or ₹16 Lakh/month lease",
    location: "Baikampady Industrial Estate / New Mangalore Port Corridor",
    city: "Mangalore",
    state: "Karnataka",
    area: "85,000 sq ft",
    carpetArea: "78,000 sq ft",
    parking: "25 Heavy Vehicle Stalls + 40 Car Bays",
    facing: "Port Link Highway Facing",
    floor: "Heavy Crane-Equipped Industrial Shed + Admin Block",
    age: "Constructed 2022",
    status: "For Sale",
    listingType: "sell",
    rating: 4.87,
    reviews: 13,
    isNew: false,
    isExclusive: true,
    isTrophy: false,
    tags: ["Deep-Water Port Adjacent", "5 MVA Power Substation", "EOT Cranes Installed", "Industrial Effluent Clearance"],
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "Strategically situated only 3 kilometers from New Mangalore Port (NMPT), this 85,000 sq ft heavy industrial campus is built for high-tech manufacturing, pharmaceuticals, precision engineering, or clean-tech export operations. Features 4 heavy-duty 20-ton overhead EOT cranes, 5 MVA dedicated power feeder, and corporate office building.",
    highlights: [
      "Just 3 km from New Mangalore Seaport deep-water docks for frictionless export/import",
      "Installed and tested 20-Ton overhead EOT bridge cranes across two bays",
      "Dedicated 5 MVA industrial substation on-site with dual feeder connections",
    ],
    details: {
      area: "85,000 sq ft Built-up",
      carpet: "78,000 sq ft (On 4.5 Acres Land)",
      ceilingHeight: "11 Meters Under Crane Hook",
      parking: "25 Container Trailers + Staff Parking",
      connectivity: "NH-66 Highway & Dedicated Railway Siding Proximity",
      powerBackup: "5 MVA Heavy Industrial Grid Connection",
      zoning: "Heavy Engineering / Export Processing",
      security: "Heavy Gatehouse, Biometric Barriers, Weighbridge",
      age: "2 Years Old",
    },
    landmarks: [
      { name: "New Mangalore Port (NMPT)", type: "port", distance: "3.2 km", color: "bg-blue-100 text-blue-700" },
      { name: "Mangalore International Airport", type: "airport", distance: "14 km", color: "bg-amber-100 text-amber-700" },
    ],
    seller: {
      name: "Varun Poojary",
      title: "Regional Director, Luxury Coastal Estates",
      phone: "+91 98450 12345",
      email: "varun.poojary@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 18,
    },
    roi: "10.2% Net Cap Rate with Export Manufacturer Leases",
    coordinates: { lat: 12.94, lng: 74.82 },
  },

  // ==========================================
  // 4. AGRICULTURAL ESTATES & FARMLANDS
  // ==========================================
  {
    id: "8",
    title: "The Highland Heritage Coffee & Vineyard Estate",
    tagline: "48-Acre Sprawling Mountain Domain with Colonial Manor & Natural Waterfalls",
    category: "agriculture",
    propertyType: "Heritage Farm & Vineyard",
    price: "₹18.5 Cr",
    originalPrice: "₹21.0 Cr",
    priceNumeric: 18.5,
    location: "Bababudangiri Foothills, Chikmagalur / DK Border",
    city: "Chikmagalur",
    state: "Karnataka",
    area: "48 Acres",
    carpetArea: "6,500 sq ft Manor House",
    bedrooms: 6,
    bathrooms: 6,
    parking: "Dedicated 10-Vehicle Compound",
    facing: "East (Valley & Sunrise View)",
    floor: "Colonial Single-Level Estate Manor + Guest Cottage",
    age: "Fully Restored Heritage (Circa 1928)",
    status: "For Sale",
    listingType: "sell",
    rating: 4.97,
    reviews: 21,
    isNew: false,
    isExclusive: true,
    isTrophy: true,
    tags: ["Private Waterfall", "Arabica Coffee", "Sprawling 48 Acres", "Colonial Heritage Manor", "Clear Land Title"],
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "An incomparable 48-acre high-altitude agricultural sanctuary nestled in the misty Western Ghats. Producing award-winning single-origin Arabica coffee and pepper, the estate features a meticulously restored 1928 British colonial manor with Italian fireplace, private natural perennial waterfall, swimming lake, private helipad landing lawn, and manager's quarters.",
    highlights: [
      "48 contiguous acres of fertile, shade-grown Arabica coffee and organic spice crops",
      "Private perennial waterfall and crystal spring-fed natural swimming lake",
      "Restored 6,500 sq ft heritage colonial manor house with expansive teak verandahs",
      "Substantial active annual yield with existing commercial distribution contracts",
    ],
    details: {
      area: "48 Contiguous Acres",
      carpet: "6,500 sq ft Heritage Manor",
      soilType: "Deep Rich Humus Volcanic Forest Loam",
      crops: "Export-grade Arabica Coffee, Black Pepper, Cardamom, Exotic Citrus",
      waterSource: "Private Natural Perennial Waterfall + 3 Deep Spring Lakes",
      electricity: "Dedicated 3-Phase Commercial Transformer + Solar",
      security: "Full Solar-Fenced Perimeter + Gated Warden Lodge",
      parking: "10-Vehicle Compound",
      age: "Manor Restored 2024",
    },
    landmarks: [
      { name: "Mullayanagiri Peak", type: "mountain", distance: "12 km", color: "bg-emerald-100 text-emerald-700" },
      { name: "Chikmagalur Golf Club", type: "club", distance: "14 km", color: "bg-blue-100 text-blue-700" },
    ],
    seller: {
      name: "Siddharth Rao",
      title: "Principal Advisor, Agricultural & Estate Lands",
      phone: "+91 94480 77123",
      email: "siddharth.rao@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 16,
    },
    roi: "Annual Harvest Revenue ₹85L+ with 14% Land Value CAGR",
    coordinates: { lat: 13.3153, lng: 75.7754 },
  },

  {
    id: "9",
    title: "The Belthangady Royal Sandalwood Reserve",
    tagline: "32-Acre Riverfront Farmstead with Licensed Sandalwood & Luxury Villa",
    category: "agriculture",
    propertyType: "Riverfront Agro-Forestry",
    price: "₹12.5 Cr",
    priceNumeric: 12.5,
    location: "Belthangady Foothills, Dakshina Kannada, Karnataka",
    city: "Dakshina Kannada",
    state: "Karnataka",
    area: "32 Acres",
    carpetArea: "4,800 sq ft Modern Farm Villa",
    bedrooms: 4,
    bathrooms: 4,
    parking: "Dedicated 6-Car Courtyard",
    facing: "North-East (River Frontage)",
    floor: "G + 1 Architectural Villa",
    age: "Completed 2023",
    status: "For Sale",
    listingType: "sell",
    rating: 4.89,
    reviews: 17,
    isNew: false,
    isExclusive: true,
    isTrophy: false,
    tags: ["River Frontage", "Licensed Sandalwood", "Designer Farm Villa", "Organic Fruit Orchard", "Dakshina Kannada"],
    images: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "A rare 32-acre riverfront agro-reserve in the scenic belt of Dakshina Kannada. Features 3,500 legally tagged and government-registered Indian Sandalwood trees approaching maturity, along with high-yield coconut, areca nut, and organic mango groves. Includes an ultra-modern 4,800 sq ft river-facing glass villa, infinity plunge pool, and private boat launch onto the Netravati river tributary.",
    highlights: [
      "Over 3,500 government-certified Sandalwood trees with huge harvest value",
      "Direct 800-foot pristine river frontage with private timber boat dock",
      "Architect-designed modern minimalist villa with expansive covered decks",
    ],
    details: {
      area: "32 Acres",
      carpet: "4,800 sq ft Farmhouse",
      soilType: "Alluvial Riverbed Soil (Extremely Fertile)",
      crops: "Sandalwood, Teak, Areca Nut, Coconut, Alphonso Mangoes",
      waterSource: "Perennial River Pumping Rights + 4 Heavy-Yield Borewells",
      electricity: "Dedicated Substation + Solar Hybrid Setup",
      security: "Laser Perimeter Sensors + 24/7 Security Guards",
      parking: "6 Covered Bays",
      age: "Villa Built in 2023",
    },
    landmarks: [
      { name: "Dharmasthala Sanctuary", type: "spiritual", distance: "14 km", color: "bg-amber-100 text-amber-700" },
      { name: "Mangalore City Centre", type: "city", distance: "52 km (Expressway)", color: "bg-blue-100 text-blue-700" },
    ],
    seller: {
      name: "Varun Poojary",
      title: "Regional Director, Luxury Coastal Estates",
      phone: "+91 98450 12345",
      email: "varun.poojary@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 18,
    },
    roi: "Immense capital appreciation upon Sandalwood maturity harvest",
    coordinates: { lat: 13.0, lng: 75.25 },
  },

  // ==========================================
  // PROPERTY 10: UDUPI TROPHY ASSET
  // ==========================================
  {
    id: "10",
    title: "The Malpe Beachfront Luxury Villa & Coconut Grove",
    tagline: "Rare 1.8-Acre Private Beach Sanctuary along Malpe Oceanfront Drive, Udupi",
    category: "residential",
    propertyType: "Beachfront Villa",
    price: "₹11.2 Cr",
    originalPrice: "₹12.5 Cr",
    priceNumeric: 11.2,
    location: "Malpe Oceanfront Drive, Udupi, Karnataka",
    city: "Udupi",
    state: "Karnataka",
    area: "7,200 sq ft",
    carpetArea: "6,400 sq ft",
    bedrooms: 5,
    bathrooms: 6,
    parking: "4 Covered Bays + Private Driveway",
    facing: "West (Direct Sunset & Arabian Sea View)",
    floor: "G + 1 Tropical Modern Villa",
    age: "Brand New (Ready to Move)",
    status: "For Sale",
    listingType: "sell",
    rating: 4.96,
    reviews: 14,
    isNew: true,
    isExclusive: true,
    isTrophy: true,
    tags: ["Direct Sea Access", "Beachfront", "Udupi", "Malpe", "Coconut Grove", "Clear Title", "Infinity Pool"],
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "A serene oceanfront haven spanning 1.8 acres of private coconut groves directly opening onto Malpe beach, Udupi. Crafted with natural laterite, seasoned teak, and full-height glass expanses offering uninterrupted sunset views over St. Mary's Islands.",
    highlights: [
      "Direct boardwalk onto Malpe golden beach",
      "50-ft freshwater pool with sunken lounge",
      "120 bearing coconut palms with drip irrigation",
      "100% solar power autonomy with silent DG backup",
      "Single-owner freehold RTC and conversion approval",
    ],
    details: {
      bedrooms: "5 Luxury Suites with Walk-in Closets",
      bathrooms: "6 Ensuite Spa Baths",
      area: "7,200 sq ft",
      carpet: "6,400 sq ft (On 1.8 Acres Land)",
      parking: "4 Covered Bays",
      furnished: "Designer Furnished",
      facing: "West (Ocean Sunset)",
      floor: "Ground + 1 Floor",
      age: "Brand New",
      electricity: "20kW Solar + Silent DG Backup",
      water: "Private Deep Borewells + RO Water Plant",
      security: "Biometric 24/7 + High-Perimeter Sensors",
    },
    landmarks: [
      { name: "Malpe Beach & Sea Walk", type: "beach", distance: "0.5 km", color: "bg-blue-100 text-blue-700" },
      { name: "Manipal University Hub", type: "education", distance: "7.8 km", color: "bg-amber-100 text-amber-700" },
      { name: "Udupi Railway Station", type: "transport", distance: "4.5 km", color: "bg-purple-100 text-purple-700" },
    ],
    seller: {
      name: "Rohit Singhania",
      title: "Senior VP, JayaListing Royal Portfolio",
      phone: "+91 82965 30609",
      email: "rohit.singhania@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 15,
    },
    roi: "14% Projected Annual Capital Growth via Coastal Tourism Corridor",
    coordinates: { lat: 13.35, lng: 74.70 },
  },
]

export function getLuxuryPropertyById(id: string): LuxuryProperty {
  const found = LUXURY_PROPERTIES.find((p) => p.id === id)
  if (found) return found
  return LUXURY_PROPERTIES[0]
}

export function getPropertiesByCategory(category: "residential" | "commercial" | "industrial" | "agriculture"): LuxuryProperty[] {
  return LUXURY_PROPERTIES.filter((p) => p.category === category)
}

export function getAllLuxuryProperties(): LuxuryProperty[] {
  return LUXURY_PROPERTIES
}
