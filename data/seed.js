export const SEED_DATA = {
  "version": "1.0.0",
  "config": {
    "featureFlags": {
      "expenseJournal": false
    }
  },
  "organizations": [
    {
      "org_id": "ORG-LSP-01",
      "org_type": "LSP",
      "legal_name": "Antigravity Healthcare Financing LSP Private Limited",
      "registration_no": "CIN-U72900MH2026PTC999001",
      "status": "ACTIVE"
    },
    {
      "org_id": "HOSP-01",
      "org_type": "HOSPITAL",
      "legal_name": "Sahyadri Care Super Specialty Hospital",
      "registration_no": "MED-MH-PUN-2024-101",
      "status": "ACTIVE",
      "branches": [
        {
          "branch_id": "BRANCH-01",
          "code": "PUN-MAIN",
          "name": "Pune Main Branch",
          "city": "Pune",
          "address": "Plot 14, Senapati Bapat Road, Pune, Maharashtra 411016",
          "status": "ACTIVE"
        },
        {
          "branch_id": "BRANCH-02",
          "code": "PUN-KOT",
          "name": "Kothrud Care Center",
          "city": "Pune",
          "address": "Survey 84, Paud Road, Kothrud, Pune, Maharashtra 411038",
          "status": "ACTIVE"
        }
      ]
    },
    {
      "org_id": "HOSP-02",
      "org_type": "HOSPITAL",
      "legal_name": "Apex Multi-Specialty Health Institute",
      "registration_no": "MED-MH-MUM-2023-202",
      "status": "ACTIVE",
      "branches": [
        {
          "branch_id": "BRANCH-03",
          "code": "MUM-CEN",
          "name": "Mumbai Central Hospital",
          "city": "Mumbai",
          "address": "Dr. E Moses Road, Mumbai Central, Mumbai, Maharashtra 400011",
          "status": "ACTIVE"
        },
        {
          "branch_id": "BRANCH-04",
          "code": "MUM-AND",
          "name": "Andheri West Center",
          "city": "Mumbai",
          "address": "Link Road, Andheri West, Mumbai, Maharashtra 400053",
          "status": "ACTIVE"
        }
      ]
    },
    {
      "org_id": "LENDER-A",
      "org_type": "NBFC",
      "legal_name": "CareFinance Capital NBFC Private Limited",
      "registration_no": "RBI-NBFC-B-14.00981",
      "status": "ACTIVE",
      "grievance_email": "grievance@carefinance.mock",
      "nodal_officer": "R. Swaminathan"
    },
    {
      "org_id": "LENDER-B",
      "org_type": "NBFC",
      "legal_name": "HealthCredit India NBFC Limited",
      "registration_no": "RBI-NBFC-N-07.00452",
      "status": "ACTIVE",
      "grievance_email": "compliance@healthcredit.mock",
      "nodal_officer": "M. Kulkarni"
    }
  ],
  "beneficiary_accounts": [
    {
      "beneficiary_id": "BENEF-01",
      "branch_id": "BRANCH-01",
      "hospital_id": "HOSP-01",
      "account_holder": "Sahyadri Care Hospital Pune Operations",
      "bank_name": "HDFC Bank",
      "ifsc": "HDFC0001234",
      "account_number_masked": "•••• •••• 4092",
      "account_number_raw": "98765432104092",
      "verification_status": "VERIFIED",
      "effective_from": "2026-01-01"
    },
    {
      "beneficiary_id": "BENEF-02",
      "branch_id": "BRANCH-03",
      "hospital_id": "HOSP-02",
      "account_holder": "Apex Multi-Specialty Health Institute",
      "bank_name": "ICICI Bank",
      "ifsc": "ICIC0005678",
      "account_number_masked": "•••• •••• 8812",
      "account_number_raw": "11223344558812",
      "verification_status": "VERIFIED",
      "effective_from": "2026-01-01"
    }
  ],
  "lender_products": [
    {
      "product_id": "PROD-01",
      "lender_id": "LENDER-A",
      "product_name": "CareFinance Medical Loan",
      "drawdown_mode": "SINGLE_DISBURSEMENT",
      "multi_drawdown": false,
      "min_amount": 25000,
      "max_amount": 500000,
      "apr_display": "11.5% - 14.0% p.a.",
      "tenor_months": [6, 12, 18, 24],
      "kfs_template": "KFS-CAREFIN-STD-2026",
      "cooling_off_days": 3,
      "status": "ACTIVE"
    },
    {
      "product_id": "PROD-02",
      "lender_id": "LENDER-B",
      "product_name": "HealthCredit Staged Care Facility",
      "drawdown_mode": "MULTI_DRAWDOWN",
      "multi_drawdown": true,
      "requires_borrower_auth_per_drawdown": true,
      "min_amount": 50000,
      "max_amount": 1000000,
      "apr_display": "12.0% - 15.5% p.a.",
      "tenor_months": [12, 24, 36],
      "kfs_template": "KFS-HLTHCRED-FAC-2026",
      "cooling_off_days": 3,
      "status": "ACTIVE"
    }
  ],
  "users": [
    {
      "user_id": "USR-PRIYA",
      "name": "Priya Sharma",
      "email": "priya.sharma@aidvans.mock",
      "phone": "+91 98000 00001",
      "role": "EXECUTIVE",
      "org_id": "ORG-LSP-01",
      "assigned_hospital_ids": ["HOSP-01"],
      "assigned_branch_ids": ["BRANCH-01", "BRANCH-02"],
      "status": "ACTIVE",
      "context": "Financing executive stationed at Sahyadri Care Hospital Pune branch desk."
    },
    {
      "user_id": "USR-IMRAN",
      "name": "Imran Khan",
      "email": "imran.khan@aidvans.mock",
      "phone": "+91 98000 00002",
      "role": "EXECUTIVE",
      "org_id": "ORG-LSP-01",
      "assigned_hospital_ids": ["HOSP-02"],
      "assigned_branch_ids": ["BRANCH-03", "BRANCH-04"],
      "status": "ACTIVE",
      "context": "Executive assigned to Apex Multi-Specialty Mumbai branch (used for scope testing)."
    },
    {
      "user_id": "USR-SUNITA",
      "name": "Sunita Patil",
      "email": "sunita.patil@sahyadri.mock",
      "phone": "+91 98000 00003",
      "role": "HOSPITAL_FINANCE",
      "org_id": "HOSP-01",
      "branch_id": "BRANCH-01",
      "status": "ACTIVE",
      "context": "Hospital 1 Senior Billing and Finance Officer handling demands and receipts."
    },
    {
      "user_id": "USR-RAJESH",
      "name": "Rajesh Deshmukh",
      "email": "rajesh.d@sahyadri.mock",
      "phone": "+91 98000 00004",
      "role": "HOSPITAL_REFERRAL",
      "org_id": "HOSP-01",
      "branch_id": "BRANCH-01",
      "status": "ACTIVE",
      "context": "Hospital 1 Admission Desk Referral Staff with least-privilege view."
    },
    {
      "user_id": "USR-ANAND",
      "name": "Anand Verma",
      "email": "anand.verma@apexhealth.mock",
      "phone": "+91 98000 00005",
      "role": "HOSPITAL_FINANCE",
      "org_id": "HOSP-02",
      "branch_id": "BRANCH-03",
      "status": "ACTIVE",
      "context": "Hospital 2 Finance Officer used to verify strict isolation and deny cross-hospital access."
    },
    {
      "user_id": "USR-MEHTA",
      "name": "Dr. Suresh Mehta",
      "email": "dr.mehta@sahyadri.mock",
      "phone": "+91 98000 00006",
      "role": "HOSPITAL_ADMIN",
      "org_id": "HOSP-01",
      "branch_id": "BRANCH-01",
      "status": "ACTIVE",
      "context": "Hospital 1 Medical Administrator managing staff access and bank account changes."
    },
    {
      "user_id": "USR-VIKRAM",
      "name": "Vikram Malhotra",
      "email": "vikram.malhotra@aidvans.mock",
      "phone": "+91 98000 00007",
      "role": "OPS_MANAGER",
      "org_id": "ORG-LSP-01",
      "status": "ACTIVE",
      "context": "Central Operations Manager overseeing daily reconciliation and exceptions."
    },
    {
      "user_id": "USR-ADITI",
      "name": "Aditi Joshi",
      "email": "aditi.joshi@aidvans.mock",
      "phone": "+91 98000 00008",
      "role": "PLATFORM_ADMIN",
      "org_id": "ORG-LSP-01",
      "status": "ACTIVE",
      "context": "LSP Platform Administrator managing lenders, products, and user directory."
    },
    {
      "user_id": "USR-ROHAN",
      "name": "Rohan Sen",
      "email": "rohan.sen@aidvans.mock",
      "phone": "+91 98000 00009",
      "role": "COMPLIANCE_AUDITOR",
      "org_id": "ORG-LSP-01",
      "status": "ACTIVE",
      "context": "Compliance and Internal Auditor reviewing consent, audit trails, and incidents."
    },
    {
      "user_id": "USR-NEHA",
      "name": "Neha Kulkarni",
      "email": "neha.kulkarni@aidvans.mock",
      "phone": "+91 98000 00010",
      "role": "SUPPORT_AGENT",
      "org_id": "ORG-LSP-01",
      "status": "ACTIVE",
      "context": "Customer support agent resolving case queries with masked data access."
    },
    {
      "user_id": "BOR-B1",
      "name": "Ramesh Kumar",
      "email": "ramesh.kumar@persona.mock",
      "phone": "+91 98000 00011",
      "role": "BORROWER",
      "pan": "TESTP1111A",
      "status": "ACTIVE",
      "context": "B1: Patient is the borrower. Salaried IT professional, clean path, Lender A single disbursement."
    },
    {
      "user_id": "BOR-B2",
      "name": "Amit Shah",
      "email": "amit.shah@persona.mock",
      "phone": "+91 98000 00012",
      "role": "BORROWER",
      "pan": "TESTP2222B",
      "status": "ACTIVE",
      "context": "B2: Adult son is borrower; elderly father (Kishore Shah) is patient. Lender B multi-drawdown."
    },
    {
      "user_id": "BOR-B3",
      "name": "Deepa Rao",
      "email": "deepa.rao@persona.mock",
      "phone": "+91 98000 00013",
      "role": "BORROWER",
      "pan": "TESTP3333C",
      "status": "ACTIVE",
      "context": "B3: Privacy-conscious borrower who declines data-sharing consent halfway through."
    },
    {
      "user_id": "BOR-B4",
      "name": "Vijay Nair",
      "email": "vijay.nair@persona.mock",
      "phone": "+91 98000 00014",
      "role": "BORROWER",
      "pan": "TESTP4444D",
      "status": "ACTIVE",
      "context": "B4: Borrower whose application is rejected by the lender's underwriting model."
    },
    {
      "user_id": "BOR-B5",
      "name": "Sanjay Gupta",
      "email": "sanjay.gupta@persona.mock",
      "phone": "+91 98000 00015",
      "role": "BORROWER",
      "pan": "TESTP5555E",
      "status": "ACTIVE",
      "context": "B5: Lender sanctions ₹1,50,000 against a requested ₹2,00,000 demand (partial sanction)."
    },
    {
      "user_id": "BOR-B6",
      "name": "Kavita Singh",
      "email": "kavita.singh@persona.mock",
      "phone": "+91 98000 00016",
      "role": "BORROWER",
      "pan": "TESTP6666F",
      "status": "ACTIVE",
      "context": "B6: Rural borrower with poor connectivity; drops off mid-application and resumes via secure link."
    },
    {
      "user_id": "BOR-B7",
      "name": "Manoj Shinde",
      "email": "manoj.shinde@persona.mock",
      "phone": "+91 98000 00017",
      "role": "BORROWER",
      "pan": "TESTP7777G",
      "status": "ACTIVE",
      "context": "B7: Starts on mobile web, then continues seamlessly in-app with the exact same FRID."
    },
    {
      "user_id": "BOR-B8",
      "name": "Aarav Pillai",
      "email": "guardian.pillai@persona.mock",
      "phone": "+91 98000 00018",
      "role": "BORROWER",
      "pan": "TESTP8888H",
      "status": "ACTIVE",
      "context": "B8: Patient is a 9-year-old minor; system must halt and route to manual review with no invented authority."
    },
    {
      "user_id": "BOR-B9",
      "name": "Gopalakrishnan Iyer",
      "email": "g.iyer@persona.mock",
      "phone": "+91 98000 00019",
      "role": "BORROWER",
      "pan": "TESTP9999J",
      "status": "ACTIVE",
      "context": "B9: 72-year-old borrower using small screen mobile web with large font accessibility settings."
    },
    {
      "user_id": "BOR-B10",
      "name": "Unknown Stranger",
      "email": "stranger@unknown.mock",
      "phone": "+91 98000 00020",
      "role": "BORROWER",
      "pan": "TESTP0000K",
      "status": "ACTIVE",
      "context": "B10: Unauthorised external actor attempting to guess FRID and brute force linking."
    }
  ],
  "patients": [
    {
      "patient_id": "PAT-01",
      "name": "Ramesh Kumar",
      "contact": "+91 98000 00011",
      "age": 34,
      "gender": "M",
      "hospital_admission_ref": "IPD-2026-8810"
    },
    {
      "patient_id": "PAT-02",
      "name": "Kishore Shah",
      "contact": "+91 98000 00099",
      "age": 68,
      "gender": "M",
      "hospital_admission_ref": "IPD-2026-9042"
    },
    {
      "patient_id": "PAT-08",
      "name": "Baby Master Pillai",
      "contact": "+91 98000 00018",
      "age": 9,
      "gender": "M",
      "hospital_admission_ref": "IPD-2026-7731"
    }
  ],
  "cases": [
    {
      "case_id": "CASE-1001",
      "frid": "HF-7K3M-9QX2",
      "hospital_id": "HOSP-01",
      "branch_id": "BRANCH-01",
      "patient_id": "PAT-01",
      "primary_borrower_id": "BOR-B1",
      "patient_is_borrower": true,
      "assigned_executive_id": "USR-PRIYA",
      "case_status": "INVITATION_SENT",
      "source": "DESK",
      "created_at": "2026-11-09T09:30:00Z",
      "closed_at": null,
      "closure_reason": null,
      "invitation": {
        "invite_id": "INV-1001",
        "token_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "raw_token": "TOK-DEMO-B1-VALID",
        "intended_phone_masked": "•••• •••• 11",
        "expiry": "2026-11-12T09:30:00Z",
        "consumed": false,
        "revoked": false
      }
    },
    {
      "case_id": "CASE-1002",
      "frid": "HF-4W8N-2TR9",
      "hospital_id": "HOSP-01",
      "branch_id": "BRANCH-01",
      "patient_id": "PAT-02",
      "primary_borrower_id": "BOR-B2",
      "patient_is_borrower": false,
      "borrower_relationship": "SON",
      "assigned_executive_id": "USR-PRIYA",
      "case_status": "BORROWER_LINKED",
      "source": "DESK",
      "created_at": "2026-11-08T10:00:00Z",
      "closed_at": null,
      "closure_reason": null,
      "invitation": {
        "invite_id": "INV-1002",
        "token_hash": "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef",
        "raw_token": "TOK-DEMO-B2-CONSUMED",
        "intended_phone_masked": "•••• •••• 12",
        "expiry": "2026-11-11T10:00:00Z",
        "consumed": true,
        "revoked": false
      }
    }
  ],
  "demands": [
    {
      "demand_id": "DEM-1001-1",
      "case_id": "CASE-1001",
      "beneficiary_id": "BENEF-01",
      "amount": 125000,
      "currency": "INR",
      "type": "ADMISSION_ADVANCE",
      "evidence_ref": "EST-PUN-2026-0012",
      "state": "SUBMITTED",
      "created_at": "2026-11-09T09:35:00Z"
    },
    {
      "demand_id": "DEM-1002-1",
      "case_id": "CASE-1002",
      "beneficiary_id": "BENEF-01",
      "amount": 75000,
      "currency": "INR",
      "type": "ADMISSION_ADVANCE",
      "evidence_ref": "EST-PUN-2026-0044",
      "state": "VERIFIED",
      "created_at": "2026-11-08T10:15:00Z"
    }
  ],
  "funding_requests": [],
  "applications": [],
  "sanctions": [],
  "facilities": [],
  "drawdowns": [],
  "disbursements": [],
  "receipts": [],
  "consents": [],
  "audit_logs": [
    {
      "event_id": "EVT-SEED-01",
      "actor_id": "USR-PRIYA",
      "actor_role": "EXECUTIVE",
      "action": "CASE_CREATED",
      "target_type": "CASE",
      "target_id": "CASE-1001",
      "timestamp": "2026-11-09T09:30:00Z",
      "reason": "Initial case creation at Pune desk"
    }
  ],
  "support_tickets": [
    {
      "ticket_id": "TICK-001",
      "case_id": "CASE-1001",
      "complainant_name": "R*** K***",
      "complainant_contact": "•••• •••• 11",
      "category": "DISBURSEMENT_STATUS",
      "priority": "MEDIUM",
      "owner_id": "USR-NEHA",
      "status": "OPEN",
      "created_at": "2026-11-09T11:00:00Z",
      "messages": [
        {
          "sender": "Ramesh Kumar",
          "time": "2026-11-09T11:00:00Z",
          "text": "Checking expected time for admission deposit transfer."
        }
      ]
    }
  ],
  "incidents": []
}
;
