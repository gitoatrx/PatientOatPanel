export interface MedicalSpecialty {
  value: string;
  label: string;
  category: "popular" | "more" | "health-conditions";
}

export const MEDICAL_SPECIALTIES: MedicalSpecialty[] = [
  // Popular specialties
  {
    value: "primary-care",
    label: "Primary Care Physician (PCP)",
    category: "popular",
  },
  {
    value: "obgyn",
    label: "OB-GYN (Obstetrician-Gynecologist)",
    category: "popular",
  },
  { value: "dermatologist", label: "Dermatologist", category: "popular" },
  { value: "dentist", label: "Dentist", category: "popular" },
  {
    value: "ent",
    label: "Ear, Nose & Throat Doctor (ENT / Otolaryngologist)",
    category: "popular",
  },
  { value: "eye-doctor", label: "Eye Doctor", category: "popular" },
  { value: "psychiatrist", label: "Psychiatrist", category: "popular" },
  {
    value: "orthopedic",
    label: "Orthopedic Surgeon (Orthopedist)",
    category: "popular",
  },

  // More specialties (a-z)
  { value: "acupuncturist", label: "Acupuncturist", category: "more" },
  { value: "allergist", label: "Allergist (Immunologist)", category: "more" },
  { value: "audiologist", label: "Audiologist", category: "more" },
  {
    value: "cardiologist",
    label: "Cardiologist (Heart Doctor)",
    category: "more",
  },
  {
    value: "cardiothoracic",
    label: "Cardiothoracic Surgeon",
    category: "more",
  },
  { value: "chiropractor", label: "Chiropractor", category: "more" },
  { value: "colorectal", label: "Colorectal Surgeon", category: "more" },
  { value: "dietitian", label: "Dietitian / Nutritionist", category: "more" },
  {
    value: "endocrinologist",
    label: "Endocrinologist (incl Diabetes Specialists)",
    category: "more",
  },
  {
    value: "gastroenterologist",
    label: "Gastroenterologist",
    category: "more",
  },
  { value: "geriatrician", label: "Geriatrician", category: "more" },
  {
    value: "hearing-specialist",
    label: "Hearing Specialist",
    category: "more",
  },
  {
    value: "hematologist",
    label: "Hematologist (Blood Specialist)",
    category: "more",
  },
  {
    value: "infectious-disease",
    label: "Infectious Disease Specialist",
    category: "more",
  },
  { value: "infertility", label: "Infertility Specialist", category: "more" },
  { value: "midwife", label: "Midwife", category: "more" },
  { value: "naturopathic", label: "Naturopathic Doctor", category: "more" },
  {
    value: "nephrologist",
    label: "Nephrologist (Kidney Specialist)",
    category: "more",
  },
  {
    value: "neurologist",
    label: "Neurologist (incl Headache Specialists)",
    category: "more",
  },
  { value: "neurosurgeon", label: "Neurosurgeon", category: "more" },
  { value: "oncologist", label: "Oncologist", category: "more" },
  { value: "ophthalmologist", label: "Ophthalmologist", category: "more" },
  { value: "optometrist", label: "Optometrist", category: "more" },
  { value: "oral-surgeon", label: "Oral Surgeon", category: "more" },
  { value: "orthodontist", label: "Orthodontist", category: "more" },
  {
    value: "pain-management",
    label: "Pain Management Specialist",
    category: "more",
  },
  { value: "pediatric-dentist", label: "Pediatric Dentist", category: "more" },
  { value: "pediatrician", label: "Pediatrician", category: "more" },
  {
    value: "physiatrist",
    label: "Physiatrist (Physical Medicine)",
    category: "more",
  },
  {
    value: "physical-therapist",
    label: "Physical Therapist",
    category: "more",
  },
  { value: "plastic-surgeon", label: "Plastic Surgeon", category: "more" },
  {
    value: "podiatrist",
    label: "Podiatrist (Foot and Ankle Specialist)",
    category: "more",
  },
  { value: "prosthodontist", label: "Prosthodontist", category: "more" },
  { value: "psychologist", label: "Psychologist", category: "more" },
  {
    value: "pulmonologist",
    label: "Pulmonologist (Lung Doctor)",
    category: "more",
  },
  { value: "radiologist", label: "Radiologist", category: "more" },
  { value: "rheumatologist", label: "Rheumatologist", category: "more" },
  {
    value: "sleep-medicine",
    label: "Sleep Medicine Specialist",
    category: "more",
  },
  {
    value: "sports-medicine",
    label: "Sports Medicine Specialist",
    category: "more",
  },
  { value: "surgeon", label: "Surgeon", category: "more" },
  { value: "therapist", label: "Therapist / Counselor", category: "more" },
  { value: "urgent-care", label: "Urgent Care Specialist", category: "more" },
  {
    value: "urological-surgeon",
    label: "Urological Surgeon",
    category: "more",
  },
  { value: "urologist", label: "Urologist", category: "more" },
  { value: "vascular-surgeon", label: "Vascular Surgeon", category: "more" },
  { value: "endodontist", label: "Endodontist", category: "more" },
  { value: "periodontist", label: "Periodontist", category: "more" },

  // Health Conditions & Symptoms (updated to match slider categories)
  { value: "allergies", label: "Allergies", category: "health-conditions" },
  { value: "back-pain", label: "Back Pain", category: "health-conditions" },
  { value: "chest-pain", label: "Chest Pain", category: "health-conditions" },
  { value: "cold-flu", label: "Cold & Flu", category: "health-conditions" },
  {
    value: "diabetes-care",
    label: "Diabetes Care",
    category: "health-conditions",
  },
  {
    value: "ear-infections",
    label: "Ear Infections",
    category: "health-conditions",
  },
  {
    value: "eye-problems",
    label: "Eye Problems",
    category: "health-conditions",
  },
  {
    value: "general-checkup",
    label: "General Checkup",
    category: "health-conditions",
  },
  { value: "headaches", label: "Headaches", category: "health-conditions" },
  { value: "joint-pain", label: "Joint Pain", category: "health-conditions" },
  {
    value: "medication-review",
    label: "Medication Review",
    category: "health-conditions",
  },
  {
    value: "mens-health",
    label: "Men's Health",
    category: "health-conditions",
  },
  {
    value: "mental-health",
    label: "Mental Health",
    category: "health-conditions",
  },
  {
    value: "pediatric-care",
    label: "Pediatric Care",
    category: "health-conditions",
  },
  { value: "respiratory", label: "Respiratory", category: "health-conditions" },
  { value: "skin-issues", label: "Skin Issues", category: "health-conditions" },
  {
    value: "sleep-issues",
    label: "Sleep Issues",
    category: "health-conditions",
  },
  {
    value: "stomach-problems",
    label: "Stomach Problems",
    category: "health-conditions",
  },
  {
    value: "urgent-care-conditions",
    label: "Urgent Care",
    category: "health-conditions",
  },
  {
    value: "womens-health",
    label: "Women's Health",
    category: "health-conditions",
  },

  // Additional categories from slider
  {
    value: "heart-health",
    label: "Heart Health",
    category: "health-conditions",
  },
  {
    value: "digestive-health",
    label: "Digestive Health",
    category: "health-conditions",
  },
  {
    value: "infectious-diseases",
    label: "Infectious Diseases",
    category: "health-conditions",
  },
  {
    value: "neurological-disorders",
    label: "Neurological Disorders",
    category: "health-conditions",
  },
  {
    value: "kidney-urinary-health",
    label: "Kidney & Urinary Health",
    category: "health-conditions",
  },
  { value: "liver-care", label: "Liver Care", category: "health-conditions" },
  {
    value: "thyroid-hormones",
    label: "Thyroid & Hormones",
    category: "health-conditions",
  },
  { value: "cancer-care", label: "Cancer Care", category: "health-conditions" },
  {
    value: "immunization",
    label: "Immunization",
    category: "health-conditions",
  },
  {
    value: "blood-pressure",
    label: "Blood Pressure",
    category: "health-conditions",
  },
  {
    value: "cholesterol-management",
    label: "Cholesterol Management",
    category: "health-conditions",
  },
  {
    value: "nutrition-diet",
    label: "Nutrition & Diet",
    category: "health-conditions",
  },
  {
    value: "physical-therapy",
    label: "Physical Therapy",
    category: "health-conditions",
  },
  {
    value: "sexual-health",
    label: "Sexual Health",
    category: "health-conditions",
  },
  {
    value: "reproductive-health",
    label: "Reproductive Health",
    category: "health-conditions",
  },
  {
    value: "geriatric-care",
    label: "Geriatric Care",
    category: "health-conditions",
  },
  {
    value: "adolescent-health",
    label: "Adolescent Health",
    category: "health-conditions",
  },
  {
    value: "travel-medicine",
    label: "Travel Medicine",
    category: "health-conditions",
  },
  {
    value: "addiction-support",
    label: "Addiction Support",
    category: "health-conditions",
  },
  {
    value: "post-surgery-recovery",
    label: "Post-Surgery Recovery",
    category: "health-conditions",
  },
  { value: "sleep-apnea", label: "Sleep Apnea", category: "health-conditions" },
  {
    value: "autoimmune-conditions",
    label: "Autoimmune Conditions",
    category: "health-conditions",
  },
  {
    value: "fitness-preventive-care",
    label: "Fitness & Preventive Care",
    category: "health-conditions",
  },
  {
    value: "weight-management",
    label: "Weight Management",
    category: "health-conditions",
  },
  {
    value: "telehealth-services",
    label: "Telehealth Services",
    category: "health-conditions",
  },
  {
    value: "home-health-monitoring",
    label: "Home Health Monitoring",
    category: "health-conditions",
  },
  {
    value: "occupational-health",
    label: "Occupational Health",
    category: "health-conditions",
  },
  {
    value: "environmental-allergies",
    label: "Environmental Allergies",
    category: "health-conditions",
  },
  {
    value: "pain-management",
    label: "Pain Management",
    category: "health-conditions",
  },
  {
    value: "rare-diseases",
    label: "Rare Diseases",
    category: "health-conditions",
  },
];

// Helper functions for working with specialties
export const getPopularSpecialties = () =>
  MEDICAL_SPECIALTIES.filter((specialty) => specialty.category === "popular");

export const getMoreSpecialties = () =>
  MEDICAL_SPECIALTIES.filter((specialty) => specialty.category === "more");

export const getHealthConditions = () =>
  MEDICAL_SPECIALTIES.filter(
    (specialty) => specialty.category === "health-conditions",
  );

export const filterSpecialties = (searchTerm: string) =>
  MEDICAL_SPECIALTIES.filter((specialty) =>
    specialty.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );
