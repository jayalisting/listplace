export type PropertyType =
  | "Agricultural land"
  | "Plantation"
  | "Plot / site"
  | "House"
  | "Villa"
  | "Apartment"
  | "Commercial"
  | "Other"

export type PropertyStatus =
  | "New lead"
  | "Collecting info"
  | "Documents verified"
  | "Listed"
  | "Site visits"
  | "Negotiation"
  | "Token paid"
  | "Agreement"
  | "Registration pending"
  | "Sold"
  | "On hold"
  | "Dropped"

export type LeadStatus =
  | "New Inquiry"
  | "Contacted"
  | "Requirements Noted"
  | "Site Visit Scheduled"
  | "Negotiation"
  | "Deal Closed"
  | "Cold / Dropped"

export type ContactRole =
  | "Owner"
  | "Broker"
  | "Buyer / Lead"
  | "Family member"
  | "Lawyer"
  | "Surveyor"
  | "Other"

export type DocumentType =
  | "RTC / Pahani"
  | "Mutation"
  | "Khata"
  | "Sale deed"
  | "EC"
  | "Survey sketch / Tippan"
  | "Conversion order"
  | "Tax receipt"
  | "Partition / Gift / Will"
  | "Power of Attorney"
  | "Agreement"
  | "ID proof"
  | "Photo"
  | "Other"

export interface CrmProperty {
  id: string
  name: string
  type: PropertyType | string
  status: PropertyStatus | string
  village?: string
  area?: number | string
  unit?: string
  survey?: string
  mutation?: string
  rtc?: string
  khata?: string
  price?: number | string
  quote?: number | string
  maps?: string
  next?: string
  nextDate?: string
  description?: string
  owners: string[]
  brokers: Array<{ pid: string; quote?: number; note?: string } | string>
  log: Array<{ t: number; x: string }>
  starred?: boolean
  tags?: string[]
  timeline?: Array<{ t: number; x: string }>
  updated?: number
}

export interface CrmPerson {
  id: string
  name: string
  phone?: string
  roles: ContactRole[] | string[]
  role?: string
  leadStatus?: LeadStatus | string
  budget?: number
  reqType?: string
  reqArea?: string
  village?: string
  nextFollowUp?: string
  description?: string
  notes?: string
  starred?: boolean
  tags?: string[]
  rel?: Array<{ pid: string; type: string }>
  timeline?: Array<{ t: number; x: string }>
}

export interface CrmTask {
  id: string
  title: string
  category?: string
  due?: string
  time?: string
  pid?: string
  personId?: string
  notes?: string
  done: boolean
}

export interface CrmFile {
  id: string
  pid: string
  name: string
  type: DocumentType | string
  ref?: string
  valid?: string
  path: string
  mime?: string
  size?: number
  t?: number
}

export interface CrmSettings {
  followupRules: Record<string, number>
  whatsappTemplates: Array<{ id: string; name: string; template: string }>
  savedViews: any[]
}

export interface CrmState {
  people: CrmPerson[]
  props: CrmProperty[]
  tasks: CrmTask[]
  files: CrmFile[]
  trash: any[]
  settings: CrmSettings
  version: number
}
