export type UserRole = 'consumer' | 'carrier' | 'admin' | 'corporate' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  company?: {
    id: string;
    name: string;
    tin: string;
  };
  avatar?: string;
  googleId?: string;
}

export interface Company {
  id: string;
  inn: string;
  name: string;
  verified: boolean;
  addedAt: string;
  credentials?: CompanyCredentials;
}

export type OrderStatus = 
  | 'created'
  | 'accepted'
  | 'in_transit'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered';

export interface Location {
  address: string;
  city: string;
  lat?: number;
  lng?: number;
}

export interface Cargo {
  type: 'pallet' | 'box' | 'envelope' | 'other';
  qty: number;
  weightKg: number;
  chargeableWeight?: number;
  volumeM3: number;
  declaredValue: number;
  description?: string;
  dimensions?: string;
  density?: number;
}

export interface Party {
  name: string;
  inn: string;
  phone: string;
  address: string;
  workingHours?: string;
  transportationType?: 'auto' | 'ferry';
}

export interface Services {
  pickup: boolean;
  doorDelivery: boolean;
  insurance: boolean;
  express: boolean;
}

export interface PriceBreakdown {
  title: string;
  amount: number;
}

export interface Price {
  amount: number;
  currency: string;
  breakdown: PriceBreakdown[];
}

export interface Checkpoint {
  ts: string;
  status: OrderStatus;
  title: string;
  description?: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  id: string;
  companyId?: string;
  customer: Party;
  sender: Party;
  receiver: Party;
  route: {
    from: Location;
    to: Location;
  };
  cargo: Cargo;
  services: Services;
  price: Price;
  status: OrderStatus;
  eta?: string;
  plannedDeliveryDate?: string;
  arrivalDate?: string;
  createdAt: string;
  barcode: string;
  qr: string;
  plannedLoadingDate?: string;
  hasClaim?: boolean;
  claim?: Claim;
  tracking?: {
    checkpoints: Checkpoint[];
    liveLocation?: {
      lat: number;
      lng: number;
      updatedAt: string;
    };
  };
  timeline?: {
    created?: string;
    accepted?: string;
    in_transit?: string;
    ready_for_pickup?: string;
    out_for_delivery?: string;
    delivered?: string;
  };
}

export interface Document {
  id: string;
  orderId?: string;
  companyId?: string;
  type: 'invoice' | 'act' | 'waybill' | 'cmr' | 'customs' | 'contract';
  title: string;
  date: string;
  url: string;
  size: number;
  amount?: number;
  currency?: string;
  status?: 'paid' | 'unpaid' | 'overdue';
  plannedPaymentDate?: string;
  documentType?: 'incoming' | 'outgoing';
}

export type ClaimStatus = 'pending' | 'approved' | 'partially_approved' | 'rejected';

export interface Claim {
  id: string;
  orderId: string;
  type: 'damage' | 'shortage' | 'delay' | 'other';
  description: string;
  amount: number;
  attachments?: string[];
  status: ClaimStatus;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  orderId?: string;
  type: 'question' | 'delay' | 'damage' | 'shortage' | 'refund';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface ApiPerevozka {
  Number: string;
  DatePrih: string;
  DateVr: string;
  State: string;
  Mest: string;
  PW: string;
  W: string;
  Value: string;
  Sum: string;
  StateBill: string;
  Sender: string;
}

export interface CompanyCredentials {
  email: string;
  password: string;
}
