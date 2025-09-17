export const COLLEGE_TYPE = [
  {
    label: "College of Physicians and Surgeons of Ontario - CPSO",
    value: "CPSO",
  },
  {
    label: "RPN - College of Nurses of Ontario - CNORPN",
    value: "CNORPN",
  },
  {
    label: "RN - College of Nurses of Ontario - CNORN",
    value: "CNORN",
  },
  {
    label: "RNP - College of Nurses of Ontario - CNORNP",
    value: "CNORNP",
  },
  {
    label: "Ontario College of Pharmacists - OCP",
    value: "OCP",
  },
  {
    label: "College of Midwives of BC - CMBC",
    value: "CMBC",
  },
  {
    label: "College of Psychologists BC - CPBC",
    value: "CPBC",
  },
  {
    label: "College of Registered Nurses of BC - CRNBC",
    value: "CRNBC",
  },
  {
    label: "College of Naturopathic Physicians of BC - CNPBC",
    value: "CNPBC",
  },
  {
    label: "College of Physicians and Surgeons of British Columbia - CPSBC",
    value: "CPSBC",
  },
  {
    label: "College of Midwives of Ontario - CMO",
    value: "CMO",
  },
] as const;

export type CollegeTypeValue = (typeof COLLEGE_TYPE)[number]["value"];
