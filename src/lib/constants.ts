export const PROCEDURES = {
    'PREVENTIVE DENTISTRY': [
      { name: 'Oral Prophylaxis (Cleaning)', price: 1500 },
      { name: 'Pits and Fissure Sealants', price: 1200 },
      { name: 'Fluoride Varnish Treatment and Tooth Mousse Application', price: 1000 },
    ],
    'RESTORATIVE DENTISTRY': [
      { name: 'Dental Filling', price: 2000 },
      { name: 'Diastema Closure', price: 3500 },
    ],
    'PROSTHODONTICS': [
      { name: 'Complete Denture', price: 25000 },
      { name: 'Flexible Removable Denture', price: 20000 },
      { name: 'Acrylic Removable Denture', price: 15000 },
      { name: 'Fixed Partial Denture', price: 18000 },
      { name: 'Porcelain Fused to Metal, All Porcelain, Emax, Zirconia', price: 22000 },
      { name: 'Root Canal Treatment', price: 8000 },
      { name: 'Apicoectomy', price: 12000 },
    ],
    'COSMETIC DENTISTRY': [
      { name: 'Teeth Whitening', price: 5000 },
      { name: 'Veneers (Direct/Indirect)', price: 8000 },
      { name: 'Composite', price: 4000 },
      { name: 'E-Max', price: 15000 },
      { name: 'Signum', price: 12000 },
      { name: 'Ceramage', price: 13000 },
    ],
    'ORTHODONTICS': [
      { name: 'Braces', price: 45000 },
      { name: 'Retainers', price: 8000 },
    ],
    'PEDIATRIC DENTISTRY': [
      { name: 'Pulp Therapy', price: 3500 },
      { name: 'Stainless Steel Crown', price: 4000 },
      { name: 'Strip Off Crowns', price: 3800 },
    ],
    'TMJ MANAGEMENT': [
      { name: 'Neuromuscular Dentistry', price: 10000 },
    ],
    'ORAL SURGERY': [
      { name: 'Odontectomy (3rd Molar/Impacted Extraction)', price: 12000 },
      { name: 'Laser Gingivectomy', price: 8000 },
      { name: 'Laser Frenectomy', price: 7000 },
      { name: 'Laser Teeth Whitening', price: 10000 },
    ],
  };
  
  export const TOOTH_NUMBERS = [
    // Upper Right
    '18', '17', '16', '15', '14', '13', '12', '11',
    // Upper Left
    '21', '22', '23', '24', '25', '26', '27', '28',
    // Lower Left
    '38', '37', '36', '35', '34', '33', '32', '31',
    // Lower Right
    '41', '42', '43', '44', '45', '46', '47', '48',
  ];
  
  export const ALLERGIES_OPTIONS = [
    'Local Anesthetic',
    'Penicillin',
    'Antibiotics',
    'Sulfa drugs',
    'Aspirin',
    'Latex',
    'Others'
  ];
  
  export const SEX_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];
  
  export const BLOOD_TYPE_OPTIONS = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];