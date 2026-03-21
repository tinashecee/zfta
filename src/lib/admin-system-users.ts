export type SystemUserRole = "Applicant" | "ZIFA" | "SRC" | "Immigration";
export type SystemUserStatus = "active" | "inactive";

export type SystemUserRecord = {
  id: string;
  fullName: string;
  organisation: string;
  userType: "Approving Member" | "Football Applicant";
  role: SystemUserRole;
  email: string;
  mobile: string;
  province: string;
  lastActive: string;
  status: SystemUserStatus;
};

export const SYSTEM_USERS: SystemUserRecord[] = [
  {
    id: "usr-001",
    fullName: "Tawanda Mhlanga",
    organisation: "ZIFA Secretariat",
    userType: "Approving Member",
    role: "ZIFA",
    email: "tmhlanga@zifa.org.zw",
    mobile: "+263 772 400 115",
    province: "Harare",
    lastActive: "2026-03-19",
    status: "active",
  },
  {
    id: "usr-002",
    fullName: "Rudo Chikore",
    organisation: "Sports and Recreation Commission",
    userType: "Approving Member",
    role: "SRC",
    email: "rchikore@src.org.zw",
    mobile: "+263 773 901 128",
    province: "Harare",
    lastActive: "2026-03-18",
    status: "active",
  },
  {
    id: "usr-003",
    fullName: "Mthulisi Dube",
    organisation: "Department of Immigration",
    userType: "Approving Member",
    role: "Immigration",
    email: "mdube@immigration.gov.zw",
    mobile: "+263 774 882 920",
    province: "Bulawayo",
    lastActive: "2026-03-16",
    status: "inactive",
  },
  {
    id: "usr-004",
    fullName: "Tatenda Nyagura",
    organisation: "Dynamos FC",
    userType: "Football Applicant",
    role: "Applicant",
    email: "admin@dynamos.co.zw",
    mobile: "+263 772 440 119",
    province: "Harare",
    lastActive: "2026-03-20",
    status: "active",
  },
  {
    id: "usr-005",
    fullName: "Sibusiso Ncube",
    organisation: "Bulawayo Elite Academy",
    userType: "Football Applicant",
    role: "Applicant",
    email: "director@bulawayoelite.academy",
    mobile: "+263 774 601 221",
    province: "Bulawayo",
    lastActive: "2026-03-12",
    status: "inactive",
  },
  {
    id: "usr-006",
    fullName: "Lynette Moyo",
    organisation: "Prince Edward High School",
    userType: "Football Applicant",
    role: "Applicant",
    email: "sports@princeedward.ac.zw",
    mobile: "+263 773 903 500",
    province: "Harare",
    lastActive: "2026-03-17",
    status: "active",
  },
];

export const getSystemUserStatusClasses = (status: SystemUserStatus) =>
  status === "active"
    ? "bg-primary-fixed text-on-primary-fixed-variant"
    : "bg-surface-container-highest text-on-surface-variant";

export const getSystemRoleClasses = (role: SystemUserRole) => {
  if (role === "Applicant") {
    return "bg-secondary-fixed text-on-secondary-fixed-variant";
  }

  if (role === "ZIFA") {
    return "bg-primary/10 text-primary";
  }

  if (role === "SRC") {
    return "bg-secondary/10 text-secondary";
  }

  return "bg-tertiary/10 text-tertiary";
};
