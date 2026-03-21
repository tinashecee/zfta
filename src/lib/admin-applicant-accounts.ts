export type ApplicantOrganisationType = "Football Club" | "Academy" | "High School" | "Primary School";

export type ApplicantAccountStatus =
  | "pendingProfile"
  | "pendingApproval"
  | "active"
  | "rejected"
  | "suspended";

export type ApplicantProvince =
  | "Harare"
  | "Bulawayo"
  | "Manicaland"
  | "Mashonaland Central"
  | "Mashonaland East"
  | "Mashonaland West"
  | "Masvingo"
  | "Matabeleland North";

export type DuplicateFlagType = "email" | "zifa" | "mobile" | "name";

export type DuplicateFlag = {
  type: DuplicateFlagType;
  severity: "high" | "medium";
  title: string;
  description: string;
};

export type ApplicantAccountRecord = {
  id: string;
  organisationName: string;
  organisationType: ApplicantOrganisationType;
  divisionOrLeague: string;
  zifaAffiliationNumber: string;
  establishmentDate: string;
  physicalAddress: string;
  province: ApplicantProvince;
  website?: string;
  primaryContact: {
    name: string;
    role: string;
    mobile: string;
    email: string;
  };
  secondaryContact?: {
    name: string;
    mobile: string;
  };
  principalName?: string;
  registrationEmail: string;
  registeredAt: string;
  profileSubmittedAt?: string;
  registrationIpAddress: string;
  deviceInfo?: string;
  status: ApplicantAccountStatus;
  daysWaiting?: number;
  duplicateFlags: DuplicateFlag[];
};

export const ORGANISATION_TYPES: ApplicantOrganisationType[] = [
  "Football Club",
  "Academy",
  "High School",
  "Primary School",
];

export const PROVINCES: ApplicantProvince[] = [
  "Harare",
  "Bulawayo",
  "Manicaland",
  "Mashonaland Central",
  "Mashonaland East",
  "Mashonaland West",
  "Masvingo",
  "Matabeleland North",
];

export const REJECTION_REASONS = [
  "Organisation not verifiable",
  "Invalid affiliation number",
  "Duplicate account",
  "Incomplete information",
  "Suspicious registration",
  "Other",
] as const;

export const COMMON_INFO_REQUESTS = [
  "Provide valid ZIFA number",
  "Provide proof of registration",
  "Clarify organisation type",
  "Provide valid contact details",
] as const;

export const ADMIN_APPLICANT_ACCOUNTS: ApplicantAccountRecord[] = [
  {
    id: "dynamos-fc-001",
    organisationName: "Dynamos FC",
    organisationType: "Football Club",
    divisionOrLeague: "Premier Soccer League",
    zifaAffiliationNumber: "ZIFA-4492-Z",
    establishmentDate: "1963-01-01",
    physicalAddress: "Rufaro Stadium Offices, Mbare, Harare",
    province: "Harare",
    website: "https://dynamos.co.zw",
    primaryContact: {
      name: "Tatenda Nyagura",
      role: "Club Administrator",
      mobile: "+263 772 440 119",
      email: "admin@dynamos.co.zw",
    },
    secondaryContact: {
      name: "Cuthbert Kaseke",
      mobile: "+263 772 111 903",
    },
    registrationEmail: "accounts@dynamos.co.zw",
    registeredAt: "2026-03-04",
    profileSubmittedAt: "2026-03-08",
    registrationIpAddress: "197.221.238.19",
    deviceInfo: "Chrome 134 on Windows 11",
    status: "pendingApproval",
    daysWaiting: 12,
    duplicateFlags: [
      {
        type: "name",
        severity: "medium",
        title: "Similar organisation name detected",
        description: "A record named 'Dynamos Football Club Trust' already exists in the applicant register.",
      },
    ],
  },
  {
    id: "bulawayo-academy-002",
    organisationName: "Bulawayo Elite Academy",
    organisationType: "Academy",
    divisionOrLeague: "Junior Development League",
    zifaAffiliationNumber: "ZIFA-AC-2108",
    establishmentDate: "2018-02-11",
    physicalAddress: "16 Fife Street Extension, Bulawayo",
    province: "Bulawayo",
    website: "https://bulawayoelite.academy",
    primaryContact: {
      name: "Sibusiso Ncube",
      role: "Director",
      mobile: "+263 774 601 221",
      email: "director@bulawayoelite.academy",
    },
    secondaryContact: {
      name: "Thandeka Ndlovu",
      mobile: "+263 774 602 784",
    },
    registrationEmail: "director@bulawayoelite.academy",
    registeredAt: "2026-03-11",
    registrationIpAddress: "105.29.83.210",
    deviceInfo: "Mobile Safari on iPhone",
    status: "pendingProfile",
    duplicateFlags: [],
  },
  {
    id: "prince-edward-003",
    organisationName: "Prince Edward High School",
    organisationType: "High School",
    divisionOrLeague: "Schools Premier Division",
    zifaAffiliationNumber: "ZIFA-SCH-5502",
    establishmentDate: "1898-01-01",
    physicalAddress: "24 Lezard Avenue, Milton Park, Harare",
    province: "Harare",
    primaryContact: {
      name: "Lynette Moyo",
      role: "Sports Director",
      mobile: "+263 773 903 500",
      email: "sports@princeedward.ac.zw",
    },
    secondaryContact: {
      name: "Farai Dube",
      mobile: "+263 773 903 511",
    },
    principalName: "Mr. T. Mlambo",
    registrationEmail: "accounts@princeedward.ac.zw",
    registeredAt: "2026-02-18",
    profileSubmittedAt: "2026-02-19",
    registrationIpAddress: "196.44.188.52",
    deviceInfo: "Edge 133 on Windows 10",
    status: "active",
    duplicateFlags: [],
  },
  {
    id: "mbare-primary-004",
    organisationName: "Mbare Primary School",
    organisationType: "Primary School",
    divisionOrLeague: "Schools Junior Sports Cluster",
    zifaAffiliationNumber: "ZIFA-PRI-3020",
    establishmentDate: "1987-06-14",
    physicalAddress: "Stodart Hall Grounds, Mbare, Harare",
    province: "Harare",
    primaryContact: {
      name: "Josephine Chikore",
      role: "Deputy Head",
      mobile: "+263 772 991 774",
      email: "mbareprimarysports@gmail.com",
    },
    secondaryContact: {
      name: "Edwin Chari",
      mobile: "+263 772 002 440",
    },
    principalName: "Mrs. R. Chingono",
    registrationEmail: "mbareprimarysports@gmail.com",
    registeredAt: "2026-03-01",
    profileSubmittedAt: "2026-03-03",
    registrationIpAddress: "154.120.77.18",
    deviceInfo: "Chrome 133 on Android",
    status: "rejected",
    duplicateFlags: [
      {
        type: "email",
        severity: "medium",
        title: "Generic email used for school account",
        description: "The applicant used a generic Gmail address instead of an institutional school domain.",
      },
    ],
  },
  {
    id: "highlanders-fc-005",
    organisationName: "Highlanders FC",
    organisationType: "Football Club",
    divisionOrLeague: "Premier Soccer League",
    zifaAffiliationNumber: "ZIFA-3311-H",
    establishmentDate: "1926-01-01",
    physicalAddress: "Barbourfields Stadium, Bulawayo",
    province: "Bulawayo",
    website: "https://highlandersfc.co.zw",
    primaryContact: {
      name: "Mbongeni Dube",
      role: "Operations Manager",
      mobile: "+263 773 554 191",
      email: "ops@highlandersfc.co.zw",
    },
    secondaryContact: {
      name: "Mthokozisi Ndlovu",
      mobile: "+263 773 554 811",
    },
    registrationEmail: "ops@highlandersfc.co.zw",
    registeredAt: "2026-01-20",
    profileSubmittedAt: "2026-01-21",
    registrationIpAddress: "102.134.55.83",
    deviceInfo: "Firefox 135 on macOS",
    status: "suspended",
    duplicateFlags: [],
  },
  {
    id: "eastern-rangers-006",
    organisationName: "Eastern Rangers Academy",
    organisationType: "Academy",
    divisionOrLeague: "Regional Youth League",
    zifaAffiliationNumber: "ZIFA-AC-2108",
    establishmentDate: "2024-11-03",
    physicalAddress: "Lot 8 Green Valley, Mutare",
    province: "Manicaland",
    primaryContact: {
      name: "Tinashe Mupfumi",
      role: "Founder",
      mobile: "+263 774 601 221",
      email: "registrations@easternrangers.africa",
    },
    secondaryContact: {
      name: "Shamiso Jiri",
      mobile: "+263 771 420 103",
    },
    registrationEmail: "registrations@easternrangers.africa",
    registeredAt: "2026-03-05",
    profileSubmittedAt: "2026-03-06",
    registrationIpAddress: "105.29.83.210",
    deviceInfo: "Chrome 134 on Windows 11",
    status: "pendingApproval",
    daysWaiting: 14,
    duplicateFlags: [
      {
        type: "zifa",
        severity: "high",
        title: "Affiliation number already used",
        description: "The same ZIFA affiliation number appears on Bulawayo Elite Academy.",
      },
      {
        type: "mobile",
        severity: "high",
        title: "Primary mobile number matches another account",
        description: "The listed contact number matches a recently registered academy profile.",
      },
      {
        type: "name",
        severity: "medium",
        title: "Similar academy naming pattern",
        description: "Existing accounts include 'Eastern Rangers Juniors' and 'Eastern Rangers Youth Trust'.",
      },
    ],
  },
];

export const getApplicantAccountById = (id: string) =>
  ADMIN_APPLICANT_ACCOUNTS.find((account) => account.id === id);

export const getApplicantAccountStatusLabel = (status: ApplicantAccountStatus) => {
  if (status === "pendingProfile") {
    return "Pending Profile";
  }

  if (status === "pendingApproval") {
    return "Pending Approval";
  }

  if (status === "active") {
    return "Active";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Suspended";
};

export const getApplicantAccountStatusClasses = (status: ApplicantAccountStatus) => {
  if (status === "pendingProfile") {
    return "bg-surface-container-highest text-on-surface-variant";
  }

  if (status === "pendingApproval") {
    return "bg-secondary-fixed text-on-secondary-fixed-variant";
  }

  if (status === "active") {
    return "bg-primary-fixed text-on-primary-fixed-variant";
  }

  if (status === "rejected") {
    return "bg-error-container text-on-error-container";
  }

  return "bg-tertiary/10 text-tertiary";
};

export const formatAdminDate = (value?: string) => {
  if (!value) {
    return "Not submitted";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};
