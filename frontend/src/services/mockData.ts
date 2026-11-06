import { Place } from '../types/accessibility';

/**
 * Illustrative prototype data for frontend development and testing.
 * Disclaimer: These are synthetic demonstration records for UI validation only.
 * No real-world accessibility claims or verifications are asserted.
 */
export const SAMPLE_PLACES: Place[] = [
  {
    id: 'sample-1',
    name: 'City Central Hospital',
    category: 'HOSPITAL',
    address: '100 Medical Center Blvd, Health Quarter',
    city: 'Metro City',
    latitude: 19.0760,
    longitude: 72.8777,
    verifiedCount: 14,
    lastAuditedDaysAgo: 18,
    isPrototypeSample: true,
    features: [
      { id: 'f1', featureType: 'STEP_FREE_ENTRANCE', status: 'AVAILABLE', notes: 'Automatic sliding doors with level landing' },
      { id: 'f2', featureType: 'ELEVATOR', status: 'AVAILABLE', notes: 'Dual high-capacity cabs with braille and chime' },
      { id: 'f3', featureType: 'ACCESSIBLE_RESTROOM', status: 'AVAILABLE', notes: 'Ground and first floor roll-in washrooms' },
      { id: 'f4', featureType: 'RAMP', status: 'AVAILABLE', notes: '1:14 slope gradient with double handrails' },
      { id: 'f5', featureType: 'ACCESSIBLE_PARKING', status: 'AVAILABLE', notes: '4 van-accessible marked bays near emergency' },
      { id: 'f6', featureType: 'PUBLIC_TRANSPORT_ACCESSIBILITY', status: 'NOT_VERIFIED', notes: 'Bus shelter nearby; ramp audit pending' }
    ]
  },
  {
    id: 'sample-2',
    name: 'Metropolitan University — Main Library',
    category: 'COLLEGE',
    address: '450 University Ave, Academic Quarter',
    city: 'Metro City',
    latitude: 19.0820,
    longitude: 72.8856,
    verifiedCount: 9,
    lastAuditedDaysAgo: 45,
    isPrototypeSample: true,
    features: [
      { id: 'f7', featureType: 'STEP_FREE_ENTRANCE', status: 'AVAILABLE', notes: 'North gate level ingress' },
      { id: 'f8', featureType: 'ELEVATOR', status: 'NOT_AVAILABLE', notes: 'Lift under scheduled modernization until month end' },
      { id: 'f9', featureType: 'ACCESSIBLE_RESTROOM', status: 'AVAILABLE', notes: 'Ground floor accessible cubicle' },
      { id: 'f10', featureType: 'RAMP', status: 'AVAILABLE', notes: 'East portico ramp operational' },
      { id: 'f11', featureType: 'ACCESSIBLE_PARKING', status: 'NOT_VERIFIED', notes: 'Faculty lot access audit requested' },
      { id: 'f12', featureType: 'PUBLIC_TRANSPORT_ACCESSIBILITY', status: 'AVAILABLE', notes: 'University shuttle with mechanical lift' }
    ]
  },
  {
    id: 'sample-3',
    name: 'Central Railway Terminal',
    category: 'TRANSIT_STATION',
    address: '1 Station Plaza, Downtown',
    city: 'Metro City',
    latitude: 18.9402,
    longitude: 72.8347,
    verifiedCount: 31,
    lastAuditedDaysAgo: 8,
    isPrototypeSample: true,
    features: [
      { id: 'f13', featureType: 'STEP_FREE_ENTRANCE', status: 'AVAILABLE', notes: 'Concourse ramp from street level' },
      { id: 'f14', featureType: 'ELEVATOR', status: 'AVAILABLE', notes: 'Elevator to all platforms 1 through 8' },
      { id: 'f15', featureType: 'ACCESSIBLE_RESTROOM', status: 'NOT_VERIFIED', notes: 'Audit older than 180 days; needs re-audit' },
      { id: 'f16', featureType: 'RAMP', status: 'AVAILABLE', notes: 'Pedestrian overpass ramp with tactile paving' },
      { id: 'f17', featureType: 'ACCESSIBLE_PARKING', status: 'AVAILABLE', notes: 'Short-stay drop-off bay' },
      { id: 'f18', featureType: 'PUBLIC_TRANSPORT_ACCESSIBILITY', status: 'AVAILABLE', notes: 'Level coach boarding plates on request' }
    ]
  },
  {
    id: 'sample-4',
    name: 'City Civic Centre & Public Registry',
    category: 'PUBLIC_OFFICE',
    address: '100 Administrative Blvd, Government Quarter',
    city: 'Metro City',
    latitude: 19.0570,
    longitude: 72.8650,
    verifiedCount: 5,
    lastAuditedDaysAgo: 120,
    isPrototypeSample: true,
    features: [
      { id: 'f19', featureType: 'STEP_FREE_ENTRANCE', status: 'AVAILABLE', notes: 'Main atrium zero-step entry' },
      { id: 'f20', featureType: 'ELEVATOR', status: 'AVAILABLE', notes: 'Keypad accessible with voice prompts' },
      { id: 'f21', featureType: 'ACCESSIBLE_RESTROOM', status: 'UNKNOWN', notes: 'No audit report submitted yet' },
      { id: 'f22', featureType: 'RAMP', status: 'AVAILABLE', notes: 'Rear access ramp with handrails' },
      { id: 'f23', featureType: 'ACCESSIBLE_PARKING', status: 'AVAILABLE', notes: '2 reserved civic spaces' },
      { id: 'f24', featureType: 'PUBLIC_TRANSPORT_ACCESSIBILITY', status: 'NOT_VERIFIED', notes: 'Bus stop curb cut verification pending' }
    ]
  },
  {
    id: 'sample-5',
    name: 'Grand Metro Shopping Mall',
    category: 'SHOPPING_MALL',
    address: '88 Commerce Ring Road, Shopping District',
    city: 'Metro City',
    latitude: 19.0680,
    longitude: 72.8900,
    verifiedCount: 22,
    lastAuditedDaysAgo: 12,
    isPrototypeSample: true,
    features: [
      { id: 'f25', featureType: 'STEP_FREE_ENTRANCE', status: 'AVAILABLE', notes: 'Automatic revolving and sliding doors' },
      { id: 'f26', featureType: 'ELEVATOR', status: 'AVAILABLE', notes: '4 glass observation lifts serving all floors' },
      { id: 'f27', featureType: 'ACCESSIBLE_RESTROOM', status: 'AVAILABLE', notes: 'Accessible family washrooms on each tier' },
      { id: 'f28', featureType: 'RAMP', status: 'AVAILABLE', notes: 'Underground parking to atrium ramps' },
      { id: 'f29', featureType: 'ACCESSIBLE_PARKING', status: 'AVAILABLE', notes: '12 dedicated basement bays near lifts' },
      { id: 'f30', featureType: 'PUBLIC_TRANSPORT_ACCESSIBILITY', status: 'AVAILABLE', notes: 'Direct covered ramp to metro walkway' }
    ]
  },
  {
    id: 'sample-6',
    name: 'Bistro 42 & Garden Patio',
    category: 'RESTAURANT',
    address: '42 Heritage Lane, Arts District',
    city: 'Metro City',
    latitude: 18.9220,
    longitude: 72.8330,
    verifiedCount: 4,
    lastAuditedDaysAgo: 60,
    isPrototypeSample: true,
    features: [
      { id: 'f31', featureType: 'STEP_FREE_ENTRANCE', status: 'NOT_AVAILABLE', notes: 'Historic building with 3 stone entrance steps' },
      { id: 'f32', featureType: 'ELEVATOR', status: 'NOT_AVAILABLE', notes: 'Ground floor only venue' },
      { id: 'f33', featureType: 'ACCESSIBLE_RESTROOM', status: 'UNKNOWN', notes: 'Restroom door width unrecorded' },
      { id: 'f34', featureType: 'RAMP', status: 'NOT_AVAILABLE', notes: 'No ramp installed at main entrance' },
      { id: 'f35', featureType: 'ACCESSIBLE_PARKING', status: 'UNKNOWN', notes: 'Street parking only; audit required' },
      { id: 'f36', featureType: 'PUBLIC_TRANSPORT_ACCESSIBILITY', status: 'AVAILABLE', notes: 'Flat sidewalk access from nearby tram' }
    ]
  }
];