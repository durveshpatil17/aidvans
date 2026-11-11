**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

#### **ENGINEERING DESIGN DOCUMENT** 

# **Solution Architecture & Technical Design Specification** 

Healthcare Financing Lending Service Provider Platform 

|**DOCUMENT ATTRIBUTE**|**VALUE**|
|---|---|
|Document ID|HFLSP-TDS-001|
|Version|0.1 — derived engineering design|
|Date|9 November 2026|
|Parent baseline|Healthcare Financing LSP — Master Product & Operating Blueprint v0.2|
|Audience|Founder, Product, Engineering, Architecture, QA, Security, Operations and NBFC integration teams|
|Status|Working technical proposal; not approved production architecture|
|Classification|Confidential — internal / approved implementation partners|



##### **DOCUMENT AUTHORITY** 

This document translates the master blueprint into build-oriented technical design. It does not replace confirmed business boundaries. CONFIRMED decisions are preserved; PROPOSED design choices need approval; DEPENDENT items require lender, hospital, security or legal evidence. 

_Vendor-neutral reference. Exact lender contracts, cloud provider/region, volumes, data retention and legal interpretation remain open decisions._ 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 1 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **0. Document control and interpretation** 

### **0.1 Purpose and precedence** 

This TDS defines implementation contracts for the independent healthcare-financing LSP platform: logical architecture, runtime topology, role enforcement, screens, workflows, data model, APIs, integration, deployment, security, testing and operational handover. 

- Master Product & Operating Blueprint v0.2 governs business boundaries, non-goals, operating decisions and open business questions. 

- PRD v0.1 governs product behaviours and acceptance criteria. This TDS translates those into technical implementation detail. 

- Signed NBFC product sheets, KFS, lender API contracts, hospital operating protocols and written legal/compliance opinions override generic adapter assumptions for the applicable partner/product. 

### **0.2 Requirement tags** 

|**Tag**|**Meaning**|**Build treatment**|
|---|---|---|
|CONFIRMED|Founder/business boundary already established.|Preserve unless formally changed.|
|PROPOSED|Technical or UX recommendation.|Review and approve before implementation.|
|DEPENDENT|Requires signed lender/API, hospital protocol, security<br>or legal input.|Make configurable; do not hard-code assumptions.|
|OPTIONAL|Can be enabled after separate scope/compliance<br>decision.|Feature flag OFF until approved.|
|OUT OF SCOPE|Explicit exclusion from LSP boundary.|Do not build unless business scope changes.|



### **0.3 Confirmed design constraints carried forward** 

|**Area**|**Baseline**|**Tag**|
|---|---|---|
|Business role|LSP only; no lending from own balance sheet and no credit approval.|CONFIRMED|
|Hospital integration|No HMS/HIS/ERP/EHR/billing system integration in current scope.|CONFIRMED|
|Case creation|Executive initiates case and generates FRID; app cannot originate loan without executive-created case.|CONFIRMED|
|Channels|Executive portal, restricted hospital portal, borrower mobile web, optional native app, admin/operations.|CONFIRMED|
|Family contribution|Personal/family contribution is out of scope; never capture or reconcile it.|CONFIRMED|
|Loan money|NBFC pays verified hospital beneficiary directly where its specific end-use product and legal structure<br>permit. LSP never receives funds.|CONFIRMED /<br>DEPENDENT|
|Multiple tranches|Represent only when a lender product explicitly supports reusable facility/multiple drawdowns.|DEPENDENT|
|Expense journal|Optional borrower-only feature, separate from lender loan ledger and inaccessible to staff.|OPTIONAL /<br>DEPENDENT|



##### **BOUNDARY** 

The platform is not an NBFC core lending system, hospital billing ledger, insurance claims system, or family-expense allocation tool. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 2 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **1. Solution architecture** 

_Design objective: operate independently of hospital software while reducing repeated data entry, handoffs and uncertainty between borrower, executive, hospital and lender._ 

### **1.1 Logical architecture** 



<!-- Start of picture text -->
INDEPENDENT LSP PLATFORM — LOGICAL ARCHITECTURE<br>‘Access channels<br>{LSP application — proposed modular monolith + workers<br>only if approved<br>Platform infastuctule<br>External paities — no HMS integration<br><!-- End of picture text -->

_Figure 1. Logical architecture. Hospital collaboration occurs through a restricted portal and human workflow; no HMS integration is in scope._ 

### **1.2 Recommended architectural style** 

PROPOSED: begin with a modular monolith for core business domains, plus independently scalable background workers and per-lender adapters. This keeps case/demand/funding state changes transactional without the deployment and observability overhead of multiple microservices. Split modules into separate services only when measured scale, team ownership, security boundary or partner connectivity justifies it. 

|**Design choice**|**Recommendation**|**Reason**|
|---|---|---|
|Backend structure|Modular monolith + workers.|Consistent transaction boundaries; lower early operational overhead.|
|Database|Managed relational database; PostgreSQL is a suitable<br>reference.|Strong relations/constraints and transactional workflows.|
|Async processing|Queue + transactional outbox/inbox.|Lender APIs, notifications and callbacks must not block the portal.|
|Partner interface|Adapter per lender/product version.|Prevent lender-specific payload/status leakage into core domain.|
|Frontend|Separate portal applications or modules over shared<br>design system/API.|Role-specific user experience, common identity and domain contracts.|
|Native app|Same versioned API as mobile web.|No separate lending backend; secure continuation after install.|
|Reporting|Read-optimised projections/views.|Avoid heavy report queries against transactional writes.|



### **1.3 System-of-record boundaries** 

|**Domain**|**Authoritative owner**|**LSP stores**|**LSP must not**|
|---|---|---|---|
|LSP service workflow|LSP|Case, party links, FRID, demand workflow,<br>application orchestration, tasks, exceptions and<br>audit.|Represent LSP state as official loan or<br>hospital ledger state.|
|Credit / loan account|NBFC/bank|External references, lender-reported status and<br>documents/statements permitted by agreement.|Approve credit, alter APR/EMI, calculate<br>official interest or receive loan funds.|
|Hospital billing|Hospital|Demand assertion, evidence reference, authorised<br>verifier and receipt confirmation.|Calculate final bill, allocate family deposits or<br>settle hospital ledger.|
|Borrower personal journal|Borrower|Nothing by default; optional isolated journal if<br>permitted.|Track family contributions or expose journal<br>to hospital/LSP staff.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 3 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

### **1.4 Domain modules and write ownership** 

|**Module**|**Responsibilities**|**Primary records**|
|---|---|---|
|Identity & access|Authentication, sessions, MFA, membership, role, ABAC and<br>masking.|User, Membership, RoleAssignment, Session,<br>AccessAudit.|
|Organisation registry|LSP/hospital/lender entities, branches, active status, beneficiary<br>verification.|Organisation, HospitalBranch, BeneficiaryAccount.|
|Party & case|Patient, borrower, case parties, assignments, FRID and invitation.|Patient, Borrower, CaseParty, FinancingCase,<br>FRIDInvitation.|
|Demand management|Advance/pre-procedure/interim/final demand capture, verification<br>and dispute.|HospitalDemand, DemandEvent,<br>DemandEvidenceReference.|
|Lending orchestration|Product mapping, application submission/status, offer/KFS<br>reference, funding request.|LenderProductVersion, LoanApplication, Offer,<br>FundingRequest.|
|Financial evidence|Sanction/facility/drawdown/disbursement references and hospital<br>receipt.|Sanction, Facility, Drawdown, Disbursement,<br>HospitalReceipt.|
|Consent & document control|Notices, purpose-specific consent, allowed document<br>metadata/reference, retention.|ConsentRecord, DocumentReference.|
|Operations/support|Assignment, exception, SLA, ticket, complaint, communication,<br>maker-checker.|Task, Exception, Ticket, AuditEvent, Notification.|
|Expense journal|Optional personal user feature, isolated from lending records.|Separate expense schema/store only after approval.|



### **1.5 Logical transaction boundaries** 

- A command that changes a domain record and emits an event commits both the business change and outbox event in one database transaction. 

- Never call an external lender synchronously inside a long database transaction. Commit a pending request and outbox event, call partner asynchronously, then record response. 

- Core case/demand/application records are relational; raw partner payloads are isolated and retained only as needed under partner/legal controls. 

- The expense journal, if enabled, must have a separate API permission scope and ideally a separate schema/store and encryption/access policy. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 4 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **2. Deployment and runtime architecture** 



<!-- Start of picture text -->
REFERENCE DEPLOYMENT TOPOLOGY — CLOUD NEUTRAL<br>————=ews<br>{ orower Executve/ Hospital /Admin cents)<br>iN 7<br>X J<br>z. _<br>_—— /_ Zasyne workers ‘. \ TLS / signed requests \webhooks via edge<br>LlCee_ Je aOL |= {[ kus + secrets manager / |) ~{ waFc 107Ell/KYC elpush partners |<br>— —_____—_— YS<br>Logs / metrics/ traces. }« ————————<br><!-- End of picture text -->

_Figure 2. Cloud-neutral deployment topology. Cloud vendor, region, network services and DR architecture remain open decisions._ 

### **2.1 Runtime components** 

|**Component**|**Design requirement**|
|---|---|
|Web clients|Admin, operations, executive, hospital and borrower mobile web. No direct database access; all reads/writes via authenticated<br>APIs.|
|Native mobile|Optional Android/iOS app; same API; tokens in OS secure storage; no embedded lender/provider secrets; deep-link<br>continuation after install.|
|API edge|CDN/WAF, TLS termination, request-size limits, bot/rate controls, request/correlation IDs.|
|API runtime|Stateless instances; server-side access enforcement; no dependency on browser/local client for data integrity.|
|Workers|Separate consumers for lender submission, webhook processing, notifications, reconciliation, scheduled tasks and retention<br>jobs.|
|Relational DB|Private network, HA, encryption, point-in-time recovery, migration-controlled schema.|
|Queue/event bus|At-least-once delivery assumption, DLQ, bounded retry, replay support, idempotent consumer.|
|Object storage|Private encrypted storage only for explicitly approved file types; short-lived signed downloads and malware scan.|
|Secrets/KMS|Managed secret store, separate keys, rotation, access audit; never expose secret values in admin UI/logs.|
|Observability|Central structured logs, metrics and distributed traces; redact PII, tokens and lender payloads.|



### **2.2 Network and trust zones** 

- Public zone: CDN/WAF/API gateway only; database, queues, workers and object storage are not public. 

- Application zone: private API runtime and workers; outbound partner access controlled and logged. 

- Data zone: private database and object store; per-service credentials and least privilege. 

- Management zone: CI/CD, monitoring and administrative access protected with MFA and short-lived privilege. 

- Partner zone: each NBFC, OTP, KYC/eSign and notification provider isolated through a versioned adapter. 

### **2.3 Failure and recovery behaviour** 

|**Failure case**|**Required behaviour**|**Recovery control**|
|---|---|---|
|Lender API timeout|Keep outcome PENDING/UNKNOWN unless authoritative<br>failure received.|Query partner by idempotency/external reference before<br>resubmission.|
|Duplicate webhook|Do not duplicate domain transition or transaction.|Inbox unique event ID and payload-hash fallback.|
|Missing webhook|Show source timestamp and stale/unknown status.|Polling or statement reconciliation if contracted.|
|Queue outage|Core writes may commit to outbox; async work is delayed.|Publisher retries; queue backlog alert; DLQ workflow.|
|Notification outage|Business transaction remains valid; notification status<br>separately failed/pending.|Retry and alternate consented channel.|
|DB failover|Writes pause/retry safely; no duplicate command.|Managed HA, transaction retry, PITR and restore drill.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 5 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

**Failure case Required behaviour Recovery control** Object storage outage Core workflow remains active unless that file is mandatory. Pause new approved uploads; never bypass evidence 

requirement. 

### **2.4 Environments** 

|**Environment**|**Purpose**|**Data/access rule**|
|---|---|---|
|LOCAL|Developer machine.|Synthetic data only; no production borrower data.|
|DEV|Shared development.|Synthetic/masked data; mock lender; test OTP only.|
|TEST/QA|Functional/integration/security.|Synthetic test tenant and lender sandbox.|
|UAT/PRE-PROD|Hospital/lender/business acceptance.|Approved test data; separate credentials; no real payment without signed<br>test protocol.|
|PROD|Live operations.|Restricted privileged access, approved vendor agreements, backups, alerts<br>and incident roster.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 6 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **3. Identity, RBAC, ABAC and field-level access** 

Use identity + membership + scoped role assignments. Do not rely on one global role column on User. A person may have multiple contexts (for example, hospital user and borrower) but the permissions and sessions must remain separated. 

### **3.1 Role catalogue from the master blueprint** 

|**Role ID**|**Role**|**Purpose**|**Default scope**|
|---|---|---|---|
|SUPER_ADMIN|Super Administrator|Platform-wide emergency administration,<br>tenant/config governance.|All tenants only with privileged, audited<br>access.|
|PLATFORM_ADMIN|Platform Administrator|Manage platform entities, users, products, lender<br>connections, configurations.|Assigned organisation / all-platform per grant.|
|OPS_MANAGER|Operations Manager|Allocate cases, resolve exceptions, manage queues<br>and executive productivity.|Assigned geography / hospital portfolio.|
|EXECUTIVE|Financing Executive|Create cases, capture demands, coordinate borrowers<br>and track progress.|Assigned hospitals/branches and<br>own/assigned cases.|
|HOSPITAL_ADMIN|Hospital Administrator|Manage hospital staff and permitted branch-level<br>access.|Own hospital organisation and permitted<br>branches.|
|HOSPITAL_FINANCE|Hospital Finance User|Submit/verify payment demand and view relevant<br>disbursement/receipt status.|Own hospital/branch and authorised case<br>set.|
|HOSPITAL_REFERRAL|Hospital Referral User|Refer customer and see limited case status.|Own hospital/branch; least privilege.|
|SUPPORT_AGENT|Customer Support|Handle enquiries and tickets using masked data.|Assigned tickets; temporary case access if<br>approved.|
|COMPLIANCE_AUDIT<br>OR|Compliance / Audit|Review consent, disclosures, access logs, partner<br>performance and exceptions.|Read-only, scoped; privileged export<br>controlled.|
|BORROWER|Borrower account|Link FRID and access own application / lender data<br>made available.|Only verified linked cases and own profile.|
|PATIENT_VIEWER|Patient viewer|Optional restricted view when patient is not borrower<br>and lender/legal arrangement permits.|Only patient-facing hospital case summary;<br>not loan account unless borrower.|



### **3.2 RBAC permission matrix from the master blueprint** 

|**Resource / action**|**Super Admin**|**Platform**<br>**Admin**|**Ops Mgr**|**Executive**|**Hospital**<br>**Admin**|**Hospital**<br>**Finance**|**Hospital**<br>**Referral**|**Support**|**Auditor**|**Borrower**|
|---|---|---|---|---|---|---|---|---|---|---|
|Manage platform roles / policy|F|C/U|X|X|X|X|X|X|R|X|
|Manage lender config / connectors|F|C/U|R|X|X|X|X|X|R|X|
|Manage hospital org / branches|F|C/U|R|X|U own|R own|R own|X|R|X|
|Create financing case|F|C|C|C|C limited*|C referral*|C referral*|X|R|X|
|View case details|F|F|F scoped|F assigned|M own|M own|M referral|M ticket|R scoped|R linked|
|View borrower KYC / income|F audited|M/need|M/need|M/need|X|X|X|M temporary|R audited|R own|
|Edit demand record|F|U|U scoped|C/U before<br>submit|C/U own|C/U own|C limited*|X|R|X|
|Authorise loan drawdown|X|X|X|X|X|X|X|X|R audit|R via lender<br>flow|
|Lender credit decision|X|X|X|X|X|X|X|X|R audit|R own<br>decision|
|See lender offer/KFS|R audited|M|M|M process<br>only|X|X|X|M|R|R own|
|View disbursement status|F|F|F scoped|F assigned|R own|R own|M|M ticket|R|R own|
|Export reports|F|F scoped|C scoped|X|C own<br>summary|X|X|X|C audit|X|
|View personal expense journal|X|X|X|X|X|X|X|X|X|R own only|
|Handle complaint|F|C/U|C/U|C/U|C own|C own|C own|C/U|R audit|C own|
|View audit logs|F|R scoped|R ops|R own actions|R own org<br>actions|X|X|M ticket|R|R own activity<br>summary|



### **3.3 Server-side authorisation algorithm** 

1. Authenticate token/session and check MFA freshness for privileged actions. 

2. Resolve active user identity, organisation membership, branch scope and role-policy version. 

3. Check RBAC resource/action permission. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 7 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

4. Evaluate ABAC attributes: org_id, branch_id, assigned user/team, case party/borrower ownership, ticket owner, record state and data sensitivity. 

5. Apply field-level mask and export policy before serialising data. 

6. For sensitive access, record actor, purpose, resource, timestamp, source device and correlation ID in access audit. 

##### **DEFAULT DENY** 

Every API endpoint, report/export, background worker, support lookup and admin action must enforce the same policy. Hiding a button in the UI is not authorisation. 

### **3.4 ABAC scope attributes** 

|**Attribute**|**Policy use**|
|---|---|
|org_id|Hospital users can access records linked to their own hospital organisation only.|
|branch_id|Hospital finance users are limited to permitted branches.|
|assigned_user_id / team_id|Executive sees cases assigned to them or explicitly delegated.|
|case_party / borrower_id|Borrower sees only verified linked cases and own borrower information.|
|ticket_id / ticket_owner|Support sees only assigned tickets; temporary case access expires.|
|sensitivity_class|KYC/income/credit data hidden from hospital roles and support by default.|
|case_state|Identity changes after lender submission require controlled correction workflow.|
|purpose_of_access|Sensitive reads/exports require a valid operational or compliance reason.|



### **3.5 Mandatory data visibility rules** 

|**Data**|**Executive**|**Hospital user**|**Support**|**Borrower**|
|---|---|---|---|---|
|Patient contact|Mask except workflow need.|Mask or minimum display.|Mask.|Own data after<br>verification.|
|PAN/Aadhaar/KYC images|No raw access by default.|Never.|Never.|Lender/provider flow.|
|Income/bank/bureau|No by default.|Never.|Never.|Lender/provider flow.|
|Loan offer/KFS|Process-only reference.|Never.|Masked reference if ticket<br>requires.|Own lender document.|
|Disbursement status/amount|Assigned case.|Own hospital/branch allowed<br>fields.|Ticket minimum.|Own linked case.|
|Expense journal|Never.|Never.|Never.|Own only.|



### **3.6 Session and workforce controls** 

- Unique workforce account per person. No shared executive or hospital credentials. 

- MFA mandatory for administrators, operations managers, support with sensitive access, auditors and privileged hospital admins. 

- Short-lived access tokens, refresh-token rotation, session revocation and device/session listing. 

- Privileged role grants and hospital beneficiary changes use maker-checker approval; temporary break-glass access has expiry and postevent review. 

- Borrower OTP/PIN is never visible to executive or hospital staff. Staff may guide the user but cannot authenticate as them. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 8 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **4. Screen inventory and navigation specification** 

_All screen IDs below are inherited from the Master Product & Operating Blueprint v0.2. The screen inventory is a minimum build contract; each screen also needs loading, empty, error, validation, disabled, permission-denied and responsive states._ 

### **4.1 Public and authentication pages** 

|**Screen ID**|**Page / screen**|**Primary users**|**Purpose and key elements**|
|---|---|---|---|
|PUB-01|Public home / product overview|Public|Explain medical financing facilitation,<br>assisted desk, mobile web/app, LSP role<br>and limitations.|
|PUB-02|How it works|Public|Explain case creation, borrower application,<br>lender decision, direct hospital<br>disbursement where permitted.|
|PUB-03|Partner hospitals / locations|Public|Show participating hospital/branch only<br>with active agreement and current details.|
|PUB-04|Lender partners and disclosures|Public|Display lender names, links, products, LSP<br>activity, customer care and partner-required<br>disclosures.|
|PUB-05|Fees and charges explanation|Public|Explain lender charges are lender-defined;<br>LSP does not separately charge borrower for<br>LSP service.|
|PUB-06|Privacy notice|Public|Purposes, data types, parties, retention,<br>contact, consent withdrawal and grievance<br>path.|
|PUB-07|Complaint / support contact|Public|Complaint intake and lender/LSP grievance<br>escalation details.|
|AUTH-01|Workforce login|Employees|User ID/password or SSO, MFA, account<br>lock and device/session context.|
|AUTH-02|Borrower OTP / sign-in|Borrower|Verified phone/email login with anti-<br>enumeration and rate limits.|
|AUTH-03|FRID linking|Borrower|Enter/open FRID; verify secure invitation<br>token and borrower identity before showing<br>details.|
|AUTH-04|Forgot / recover account|All|Secure recovery; no account disclosure to<br>unauthenticated requester.|
|AUTH-05|MFA setup / device management|Workforce / borrower|Register authenticators, review active<br>sessions, revoke device.|
|AUTH-06|Consent and notice centre|Borrower|Review separate purpose-specific notices,<br>choices and withdrawal actions.|



### **4.2 Admin portal pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Controls**|
|---|---|---|---|
|ADM-01|Admin dashboard|Cases today, pending queues, lender status, exceptions, hospital coverage,<br>executive workload, complaints, alerts.|Role and geography filters; data<br>timestamp; no hidden credit score<br>analytics.|
|ADM-02|User directory|Create/invite/deactivate staff, assign organisation, branch, role, supervisor.|No shared accounts; dual approval for<br>privileged role.|
|ADM-03|Role and permission management|Role templates, permission matrix, ABAC attributes, field masking.|Versioned policy; least privilege; break-<br>glass audit.|
|ADM-04|Organisation management|LSP legal entities, hospital organisations, branches, lender entities, status.|Verification evidence and effective dates.|
|ADM-05|Hospital/branch management|Hospital profile, address, authorised staff, verified beneficiary account<br>metadata, contacts, agreement status.|Beneficiary changes maker-checker and<br>independent callback.|
|ADM-06|Lender directory|NBFC details, regulated status evidence, partner agreement, contacts,<br>grievance link, connector status.|Compliance approval and expiry alerts.|
|ADM-07|Lender product configuration|Ticket limits, tenure, supported drawdown modes, required fields, KFS links,<br>cooling-off config, SLA parameters.|Source from signed lender product sheet;<br>version and effective date.|
|ADM-08|Lender connector management|API credentials reference, webhook keys, certificate expiry, mapping and health.|Secrets in vault; not readable by ordinary<br>admins.|
|ADM-09|Case search and audit view|Search case/FRID/app IDs; timeline, assignment, status, exceptions.|Restricted data; search logged.|
|ADM-10|Exception management|Retry, assign, resolve, escalate, mark duplicate/fraud hold, record evidence.|No manual alteration of lender decision<br>or payment state without source<br>evidence.|
|ADM-11|Business configuration|ID formats, notifications, allowed file types, reason codes, escalation<br>thresholds.|Versioned, test-before-publish; no<br>hidden pricing/credit changes.|
|ADM-12|Reports and exports|Operational, conversion, partner, SLA, complaints and audit reports.|Export approval, watermark,<br>minimisation and access logging.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 9 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Screen ID**|**Page**|**Core elements / actions**|**Controls**|
|---|---|---|---|
|ADM-13|Audit and access logs|Login, data view, download, permission changes, status overrides, API calls.|Append-only or tamper-evident retention.|
|ADM-14|Content and disclosure manager|Privacy pages, lender disclosure links, terms versions, FAQs, contact details.|Legal approval and publication history.|
|ADM-15|Support and complaint console|Ticket queue, ownership, SLA, escalation, response and closure.|Sensitive data masked by default.|
|ADM-16|System health / integration console|Webhook errors, queue depth, lender adapter uptime, notification failures.|No secret values in logs.|



### **4.3 Operations portal pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Controls**|
|---|---|---|---|
|OPS-01|Operations dashboard|Workload, ageing, pending customer actions, lender queues, payment<br>exceptions and cases requiring human attention.|Queue scope based on role/territory.|
|OPS-02|Case allocation board|Assign/reassign executive, priority, hospital, branch and shift.|Reason required; prior assignment<br>history preserved.|
|OPS-03|Case workspace|Full LSP timeline, contacts, demand status, application refs, lender events and<br>actions.|Sensitive borrower data field-masked.|
|OPS-04|Exception workbench|Duplicate, mismatch, timeout, callback gap, failed disbursement, hospital bank<br>issue.|Resolution code and evidence<br>mandatory.|
|OPS-05|Hospital service quality|Hospital referral volume, demand turnaround, receipt confirmation and<br>complaints.|No clinical performance or patient<br>treatment inference.|
|OPS-06|Executive performance|Assigned cases, completion, ageing, QA findings and training needs.|No incentive solely on loan approval<br>without compliance review.|
|OPS-07|Daily reconciliation|Lender reported transactions vs LSP records and hospital receipt confirmations.|Maker-checker for manual adjustments.|
|OPS-08|Escalation queue|Cases approaching SLA or requiring lender/hospital senior attention.|Clock pauses/causes recorded explicitly.|
|OPS-09|Operational report exports|Date/branch/lender/owner filters and exception summaries.|Purpose and approval recorded.|



### **4.4 Executive portal pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Controls**|
|---|---|---|---|
|EXE-01|Executive home/dashboard|Assigned cases, new referrals, pending borrowers, lender decisions, payment<br>demands, disbursement follow-up.|Only assigned/authorised cases.|
|EXE-02|New financing case wizard|Select hospital/branch; identify patient and borrower separately; collect<br>minimum case data; check duplicates.|Case creation permissions; data<br>validation.|
|EXE-03|Patient and borrower details|Patient name/contact/admission reference; borrower identity/contact;<br>relationship; patient≠borrower flag.|Do not collect lender KYC beyond<br>permitted scope; separate notices.|
|EXE-04|Hospital funding need|Demand type, amount, due time, reason category, estimate/advance slip<br>reference and evidence.|Hospital confirmation or evidence policy.|
|EXE-05|Case review and FRID generation|Review minimum fields, confirm hospital scope, create unique FRID, create<br>invitation.|Only executive-initiated cases generate<br>active FRID.|
|EXE-06|Borrower invitation|QR, SMS/email deep link, resend/revoke, expiry, delivery status.|Secure one-time token; contact<br>verification.|
|EXE-07|Application progress|Lender status, pending borrower action, pending lender action, rejection reason<br>category if lender provides.|No promise or editing lender decision.|
|EXE-08|Lender offer / selection assistance|See eligible lender offers, required disclosures and KFS links.|Objective display; no hidden ranking;<br>borrower chooses.|
|EXE-09|Demand and funding request|Create later demand; attach evidence; request amount; check<br>facility/drawdown eligibility.|Do not present demand as approved loan<br>drawdown.|
|EXE-10|Disbursement tracker|Lender transaction status, beneficiary, amount, reference, value date and<br>hospital receipt.|Status sourced; no manual mark as paid<br>without evidence.|
|EXE-11|Case timeline|Immutable chronological events and notes.|Sensitive notes restricted; corrections via<br>superseding event.|
|EXE-12|Customer communication|Approved templates, language, delivery status and call outcome.|No misleading financial advice; opt-out<br>preferences.|
|EXE-13|Case closure|Close LSP case service work with reason and unresolved item check.|Does not close lender loan or hospital<br>bill.|
|EXE-14|Executive profile and tasks|Shift, assigned branch, training, checklist and account security.|Individual login; no sharing.|



### **4.5 Hospital portal pages** 

|**Screen ID**<br>**Page**|**Core elements / actions**<br>**Visibility constraints**|
|---|---|
|HOS-01<br>Hospital login|Hospital organisation and branch membership, MFA, account status.<br>No global platform ac|



No global platform access. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 10 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Screen ID**|**Page**|**Core elements / actions**|**Visibility constraints**|
|---|---|---|---|
|HOS-02|Hospital dashboard|Own branch case counts, referrals, demands awaiting confirmation, lender<br>status and receipt confirmations.|No borrower-wide personal finance<br>details.|
|HOS-03|Referral entry (optional)|Create referral/draft with patient contact and branch.|Feature-flagged; does not create active<br>financing case/FRID unless executive<br>validates.|
|HOS-04|Case lookup|Search by hospital case reference, patient-safe key or FRID.|Only own hospital/branch; no broad<br>cross-hospital search.|
|HOS-05|Demand submission|Add/confirm advance, pre-procedure, interim or final hospital demand; upload<br>evidence if permitted.|Demand can be submitted by authorised<br>finance role; maker-checker for<br>corrections.|
|HOS-06|Funding status|Submitted, lender review, sanctioned, awaiting borrower action, disbursement<br>status.|No private credit decision details beyond<br>status disclosure allowed by agreement.|
|HOS-07|Receipt confirmation|Confirm credited amount/date/reference or raise mismatch.|Receipt confirmation is distinct from<br>lender disbursement event.|
|HOS-08|Case activity and documents|View allowed hospital-side demand records and lender confirmation.|No borrower KYC, income, PAN/Aadhaar,<br>bureau report, full KFS archive unless<br>expressly authorised.|
|HOS-09|Hospital users / branch access|Hospital admin invites staff, roles and branch assignments.|Cannot assign LSP roles.|
|HOS-10|Hospital reports|Own referrals, demands, funded cases, ageing, payment exceptions.|No exports containing unnecessary<br>personal/credit data.|
|HOS-11|Hospital profile and beneficiary<br>verification|Hospital contacts, bank evidence status, branch code and agreement.|Bank account changes require<br>independent verification and dual<br>approval.|
|HOS-12|Hospital support / complaint|Raise case-specific query or dispute.|Ticket scope limited to own hospital<br>data.|



### **4.6 Borrower mobile-web/native app pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Rules**|
|---|---|---|---|
|BOR-01|Welcome / sign-in|Phone/email, OTP and privacy links.|Do not allow standalone loan origination.|
|BOR-02|Link financing case|Scan QR or enter FRID; verification and consent to link.|Only valid executive-created FRID; rate-<br>limited; one-time token.|
|BOR-03|Linked case overview|Hospital/branch, case ID, patient role, pending actions and status.|No unrelated borrower or hospital case<br>data.|
|BOR-04|My applications|Lender application references, stages, pending actions and timestamps.|Lender decision source of truth.|
|BOR-05|Complete application|Lender-required personal, occupation, income and other approved fields.|Borrower enters/reviews own data;<br>lender-defined schema/version.|
|BOR-06|Consent and data sharing|Purpose-specific permission, recipient, data categories, retention explanation<br>and withdrawal route.|No bundled/forced consent where<br>separate choices required.|
|BOR-07|KYC handoff / status|Secure lender/provider redirect or embedded authorised flow.|Do not store biometric data or<br>credentials in LSP app.|
|BOR-08|Lender offers comparison|Offer name, lender, amount, tenure, APR, instalment, charges, KFS.|Only if multi-lender flow is active;<br>unbiased fair comparison.|
|BOR-09|KFS and loan agreement|Open/download lender-issued document, accept/sign at lender endpoint.|Lender executes; versioned document<br>reference.|
|BOR-10|Additional funding request|See hospital demand and request details; confirm borrower authorisation.|Only lender facility allowing additional<br>drawdown; lender authentication<br>applies.|
|BOR-11|Disbursement timeline|Each confirmed lender disbursement, amount, beneficiary and reference.|No false credited state from request<br>submission.|
|BOR-12|Loan information|Outstanding balance, schedule, repayment, statements and charges.|Use lender-provided data; stale<br>timestamp shown; no LSP-calculated<br>authoritative balance.|
|BOR-13|Hospital episode expense journal<br>(optional)|Borrower manually records personal costs relevant to the episode.|Personal and separate; not family<br>contribution tracking; legal/data gate.|
|BOR-14|Notifications|Application updates, lender actions, due reminders if supplied, case activity.|No sensitive details in lock-screen<br>previews by default.|
|BOR-15|Help / complaints|LSP support, lender grievance contacts and complaint reference.|Show correct responsible entity and<br>escalation.|
|BOR-16|Profile / privacy centre|Account details, active devices, linked cases, consent history and request<br>routes.|Data access/deletion subject to legal<br>retention and lender obligations.|
|BOR-17|Install / app handoff|App store links and secure continuation after install.|Preserve case via secure link or<br>authenticated account; do not expose<br>FRID in analytics.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 11 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

### **4.7 Support and compliance pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Restrictions**|
|---|---|---|---|
|SUP-01|Support ticket queue|Issue category, owner, SLA, priority and case reference.|Mask borrower data.|
|SUP-02|Ticket detail|Conversation, approved event view, response templates, escalation.|No lender-side changes.|
|CMP-01|Consent audit|Notice version, purpose, affirmative action, timestamp, channel, recipient and<br>withdrawal.|Read-only evidence.|
|CMP-02|Data request queue|Access/correction/withdrawal/deletion request status.|Coordinate with lender as data<br>fiduciary/processor roles require.|
|CMP-03|Access audit|Who viewed/exported what, when, why, from which role/device.|Tamper-evident.|
|CMP-04|Partner compliance tracker|Agreement, due diligence, audit, training, privacy, security and grievance<br>evidence.|Compliance owner only.|
|CMP-05|Incident register|Incident, impact, containment, notification assessment, remediation.|Need-to-know access.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 12 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **5. Key screen wireframes and interaction contracts** 

_These are structural wireframes, not final visual design. They establish information hierarchy, permitted actions and non-negotiable workflow guards._ 

### **5.1 Executive — New Financing Case wizard** 

##### **Structural wireframe — Executive case wizard** 



<!-- Start of picture text -->
┌───────────────────────────────────────────────────────────────────┐<br>│ New Financing Case                                      Step 1/4 │<br>├───────────────────────────────────────────────────────────────────┤<br>│ HOSPITAL / BRANCH                                                 │<br>│ Hospital [Select authorised hospital ] Branch [Select ]         ▼ ▼ │<br>│ Hospital reference [________________________]                    │<br>│ │<br>│ PATIENT (person receiving treatment)                              │<br>│ Name [______________________] Contact [____________]             │<br>│ │<br>│ BORROWER (person applying / owing loan)                            │<br>│ ( ) Same as patient  ( ) Different person                         │<br>│ Name [______________________] Contact [____________]             │<br>│ Relationship to patient [____________]                            │<br>│ │<br>│ INITIAL HOSPITAL DEMAND                                           │<br>│ Type [Admission advance ] Amount [₹________] Due [date/time]     ▼ │<br>│ Evidence reference [____________________]                        │<br>│ │<br>│ [Save draft]                                  [Review case →]     │<br>└───────────────────────────────────────────────────────────────────┘<br><!-- End of picture text -->

Validation: selected hospital/branch must be active and within executive scope; patient and borrower are independent parties; initial demand amount is positive with explicit currency; duplicate candidates must be checked; no FRID is generated until minimum case validation succeeds. 

### **5.2 Executive — Case workspace** 

##### **Structural wireframe — Executive case workspace** 



<!-- Start of picture text -->
┌───────────────────────────────────────────────────────────────────┐<br>│ CASE HF-...   Status: BORROWER_LINKED   Owner: Executive           │<br>│ Hospital / Branch | Patient role | Borrower role | Created / age   │<br>├───────────────────────────────────────────────────────────────────┤<br>│ [Overview] [Demands] [Applications] [Funding] [Events] [Support]  │<br>├───────────────────────────────────────────────────────────────────┤<br>│ CASE SUMMARY                         NEXT ACTION                   │<br>│ Patient: masked name                 Borrower: Linked              │<br>│ FRID: HF-...                         Application: In progress      │<br>│ Initial demand: ₹...                 Lender action: Pending        │<br>│ │<br>│ DEMAND TIMELINE                                                    │<br>│ #1 ₹... VERIFIED             Funding request: ...                  │<br>│ #2 ₹... VERIFICATION PENDING  [Open demand]                       │<br>│ │<br>│ LENDER / DISBURSEMENT EVENTS                                       │<br>│ Source status | source time | external reference                  │<br>│ Hospital receipt: Awaiting confirmation                           │<br>│ │<br>│ [Add demand] [Funding request] [Resend invite] [Escalate]          │<br>└───────────────────────────────────────────────────────────────────┘<br><!-- End of picture text -->

##### **STATUS LANGUAGE** 

The UI must distinguish Demand submitted, Borrower authorised, Sent to lender, Lender approved, Lender confirmed transfer and Hospital confirmed receipt. Never collapse them into a generic “Paid” state. 

### **5.3 Hospital finance — Demand and receipt** 

##### **Structural wireframe — Hospital portal** 

|┌───────────────────────────────────────────────────────────────────┐<br>Hospital Finance Portal      Branch: [Current branch ]<br>│<br>▼<br>│<br>├───────────────────────────────────────────────────────────────────┤|
|---|
|Cases needing action: 06   Demands pending verification: 03<br>│<br>│<br>Disbursements awaiting receipt confirmation: 02<br>│<br>│<br>├───────────────────────────────────────────────────────────────────┤|
|CASE LOOKUP [Hospital ref / safe key / FRID] [Search]<br>│<br>│<br>├───────────────────────────────────────────────────────────────────┤|
|Case ref | Demand type | Amount | Funding status | Action<br>│<br>│|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 13 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

│ ...      | Advance     | ₹...   | Pending        | [Review]        │ │ │ │ DEMAND FORM                                                       │ │ Type [Interim ] Amount [₹____] Due [____] Evidence [ref/upload]   ▼ │ │ [Submit for verification]                                         │ │ │ │ RECEIPT CONFIRMATION                                              │ │ Transfer ref [____] Amount [₹____] Date [____]                    │ │ Bank credit [Confirmed / Mismatch] [Submit]                       │ └───────────────────────────────────────────────────────────────────┘ 

Hospital receipt confirmation creates a separate receipt record. It does not edit or replace the lender disbursement event. 

### **5.4 Borrower — FRID linking gate** 

##### **Structural wireframe — Borrower app** 

┌─────────────────────────────────────────┐ │ Welcome to [Platform]                   │ │ Continue your hospital financing case  │ │ │ │ [ Scan QR code ]                        │ │ [ Enter Financing Reference ID ]        │ │ │ │ No case ID yet? Visit the hospital      │ │ financing desk to initiate your case.  │ │ │ │ [Continue]                              │ │ Privacy | Help | Lender grievance       │ └─────────────────────────────────────────┘ 

After successful link: 

┌─────────────────────────────────────────┐ │ Your linked case                        │ │ Hospital / branch                       │ │ Patient role: Patient / Family borrower │ │ Application: Action required             │ │ │ │ [Continue lender application]           │ │ [View offer / KFS]                      │ │ [View disbursement timeline]            │ │ [My personal expenses]*                 │ │ │ │ *Only if feature/storage is approved.   │ └─────────────────────────────────────────┘ 

The app “Apply” route is a continuation or initiation of an application tied to an existing executive-created case. If no valid linked FRID/case exists, the backend must reject application creation. 

### **5.5 Admin — Lender product configuration** 

##### **Structural wireframe — Admin product config** 

┌───────────────────────────────────────────────────────────────────┐ │ Lender Products / Product Version                                │ ├───────────────────────────────────────────────────────────────────┤ │ Lender [NBFC ] Product [Medical finance ] Version [vX]          ▼ ▼ │ │ Effective from [date] Status [Draft / Approved / Retired]          │ │ │ │ COMMERCIAL / ELIGIBILITY (lender-provided)                        │ │ Min/max ticket | Tenure | APR source | Fees | KFS reference        │ │ Required application schema | Consent template                    │ │ │ │ FUNDING CAPABILITIES                                              │ │ [ ] Single disbursement  [ ] Multi-drawdown (verified)             │ │ Authorisation rule | Facility validity | EMI reset rule           │ │ │ │ CONNECTOR: field map | status map | webhook | SLA                  │ │ │ │ [Save draft] [Validate] [Submit for compliance approval]           │ └───────────────────────────────────────────────────────────────────┘ 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 14 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **6. End-to-end technical journeys and business process flows** 

### **6.1 Journey: case initiation → FRID → borrower link → application** 



<!-- Start of picture text -->
INDEPENDENT LSP PLATFORM — LOGICAL ARCHITECTURE<br>Access channels<br>NL 7<br>ee (1)<br>G=e® es = Ge «2 GS === (==)<br>— ——————————— “<br>i aera pes — no HS negraton<br>oe mmm) (Catt) (RE)<br>—<br><!-- End of picture text -->

_System context, showing channels and shared LSP core._ 

1. Executive signs in and selects an active hospital/branch within assigned scope. 

2. Executive enters patient and borrower as distinct party records; records relationship and minimum required contact data. 

3. Executive records initial payment demand if available, including demand type, amount, due time and permitted evidence reference. 

4. Backend validates required fields, organisation status, duplicates and permissions; creates CASE_ID, CaseParty records, demand (if provided), audit event and initial case state. 

5. Backend creates human-readable FRID and separate high-entropy invitation token. Token is stored hashed; raw token is sent once via secure link/QR. 

6. Borrower authenticates intended contact, verifies identity, reviews notices and provides purpose-specific consent. 

7. Backend links borrower to the existing case and unlocks application continuation. No valid executive-created case means no application. 

### **6.2 Patient and borrower are different people** 

- Patient is the person receiving treatment; borrower is the person applying and legally owing the loan under lender agreement. 

- Do not copy patient permissions onto the borrower or vice versa. A patient viewer must not automatically see KFS, EMI, income, credit or loan-account information. 

- Minor, incapacitated patient, guardian or relative-applicant handling must follow lender/legal rules. Unsupported cases must route to manual review / not supported, not have authority invented by the LSP. 

### **6.3 Application → lender decision → agreement** 

1. Borrower opens a lender-defined, versioned form schema. 

2. Borrower completes and reviews own fields; LSP validates format and requiredness only, not creditworthiness. 

3. Borrower gives data-sharing consent and completes KYC/eSign within lender-approved flow. 

4. LSP submits through adapter using stable idempotency key; stores internal APP_ID and external LENDER_APP_REF. 

5. Lender response arrives via webhook, polling or secure file. Raw and normalised status plus source timestamp are stored. 

6. Borrower reviews lender-issued offer/KFS and executes agreement through lender-controlled process. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 15 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

### **6.4 Hospital demand → funding request → drawdown → disbursement → receipt** 



<!-- Start of picture text -->
FINANCIAL EVENT CHAIN — DISTINCT OBJECTS AND OWNERS<br>Hospital Demand<br>Hospital assertion captured by LSP<br>Funding Request<br>Request against specific demand<br>Borrower Authorisation<br>Exact amount + beneficiary + request<br>Drawdown / Utilisation<br>Only if lender product supports it<br>‘<br>%<br>LenderDisbursement confirms transfer \ \ , lender accounting.<br>\<br>\<br>‘lender statement/feed'<br>Hospital Receipt = >» Loan Account / Interest / EMI<br>Hospital separately confirms credit NBFC is authoritative source<br><!-- End of picture text -->

_Figure 3. Financial event chain; each item is a distinct record and can have a different source of truth._ 

1. Authorised hospital finance staff or executive captures a new demand under the existing CASE_ID. 

2. Hospital verification confirms amount, beneficiary and demand purpose under the agreed hospital protocol. 

3. Product capability is checked: single disbursement, supported multi-drawdown facility, top-up/new application, or unsupported. 

4. FundingRequest is created against a specific demand. Initial design: one demand per funding request for traceability. 

5. Borrower reviews amount, beneficiary and lender-provided financial impact, then authorises exact request through lender-approved authentication. 

6. Lender approves/rejects and creates drawdown/disbursement if product supports it. LSP stores source event only. 

7. Hospital separately confirms bank receipt or raises mismatch. No receipt is inferred from lender confirmation. 

### **6.5 Exception journeys** 

|**Scenario**|**Expected system treatment**|**Forbidden shortcut**|
|---|---|---|
|Lender timeout / unknown|Set UNKNOWN or pending confirmation; reconcile by external<br>ref/idempotency key.|Do not mark failed or resubmit blindly.|
|Duplicate callback|Dedupe and process one logical event.|Do not create duplicate disbursement.|
|Lender confirmed, hospital has not<br>received|Keep lender transfer confirmed; receipt awaiting/mismatch.|Do not show hospital payment received.|
|Hospital demand changes|Create correction/superseding demand event; invalidate stale funding<br>request if required.|Do not overwrite demand silently.|
|Returned/reversed funds|Create new return/reversal event linked to original.|Do not delete initial confirmed transfer.|
|Borrower abandons|Keep application abandoned/pending with expiry and follow-up rules.|Do not fabricate an application submission.|
|Case closed, loan still active|LSP service case can close; lender loan remains active independently.|Do not close loan account from LSP action.|



### **6.6 Expense journal journey (optional)** 

- If approved, journal is borrower-only and separate from lender loan ledger and hospital billing. No staff role can view it. 

- No family contribution splitting, payer attribution, reconciliation or reporting. User may maintain personal notes only. 

- Feature stays disabled until counsel/NBFC compliance approve that it can be offered within the LSP DLA and specify data storage/retention role. Local-only storage is not assumed automatically compliant. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 16 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **7. State machines and transition guards** 

### **7.1 Financing case lifecycle** 

|**Current state**|**Allowed next state(s)**|**Transition guard / source**|
|---|---|---|
|DRAFT|READY_FOR_INVITATION, CANCELLED|Minimum parties/hospital/branch validated.|
|READY_FOR_INVITATION|INVITATION_SENT, ON_HOLD|Secure invite created, intended contact bound.|
|INVITATION_SENT|BORROWER_LINKED, INVITATION_EXPIRED, CANCELLED|Valid token + borrower verification; single-use consumed.|
|BORROWER_LINKED|APPLICATION_IN_PROGRESS, ON_HOLD, WITHDRAWN|Link and required notices/consents recorded.|
|APPLICATION_IN_PROGRESS|SUBMITTED, ABANDONED, WITHDRAWN|Lender schema complete and consent present.|
|SUBMITTED|LENDER_PENDING, ACTION_REQUIRED, DECIDED,<br>UNKNOWN|Submission acknowledgement or ambiguous result.|
|LENDER_PENDING|ACTION_REQUIRED, SANCTIONED, DECLINED,<br>UNKNOWN|Authoritative lender update.|
|SANCTIONED|AGREEMENT_PENDING, DISBURSEMENT_PENDING|Lender sanction terms/conditions received.|
|AGREEMENT_PENDING|AGREEMENT_EXECUTED, EXPIRED, WITHDRAWN|Lender reports execution.|
|AGREEMENT_EXECUTED|DISBURSEMENT_PENDING, ACTIVE, CANCELLED|Lender activation event.|
|DISBURSEMENT_PENDING|PARTIALLY_DISBURSED, DISBURSED, FAILED, UNKNOWN|Lender-reported transfer event.|
|PARTIALLY_DISBURSED|DISBURSEMENT_PENDING, DISBURSED, EXCEPTION|Subsequent event or unresolved mismatch.|
|DISBURSED|ADDITIONAL_DEMAND, SERVICE_COMPLETE, EXCEPTION|New demand, service completion or dispute.|
|SERVICE_COMPLETE|CLOSED|LSP close checks passed; loan may remain active.|
|DECLINED / WITHDRAWN /<br>CANCELLED|CLOSED|LSP service close; new attempt only if permitted.|



### **7.2 Demand / funding / drawdown / disbursement / receipt** 

|**State**|**Meaning / control**|
|---|---|
|DRAFT|Created but not submitted.|
|SUBMITTED|Demand submitted by authorised hospital/executive with evidence.|
|VERIFICATION_PENDING|Hospital verification or additional evidence required.|
|VERIFIED|Demand amount/beneficiary/purpose confirmed under hospital protocol.|
|FUNDING_REQUESTED|A funding request has been created; not a loan approval.|
|PARTIALLY_FUNDED|Some amount is lender-confirmed as disbursed.|
|FUNDED|Demand amount fully covered by lender-confirmed disbursements; do not include family contribution.|
|REJECTED|Demand invalid/unsupported; reason captured.|
|CANCELLED|Hospital cancelled or superseded demand.|
|DISPUTED|Borrower/hospital/LSP disputes amount or evidence.|



|**Object**|**States**|**Rules**|
|---|---|---|
|Funding request|DRAFT → PENDING_BORROWER_AUTH → AUTHORISED →<br>SENT_TO_LENDER → LENDER_PENDING → APPROVED /<br>REJECTED / EXPIRED / CANCELLED / UNKNOWN|Borrower authorisation must be recorded per lender requirement. LSP<br>cannot convert a request to approval.|
|Drawdown|NOT_SUPPORTED / REQUESTED / APPROVED / DECLINED /<br>EXPIRED / REVERSED|Only create if lender product exposes drawdown facility. Never<br>manufacture a drawdown record from a generic payment demand.|
|Disbursement|INITIATED / PROCESSING / CONFIRMED_BY_LENDER / FAILED /<br>RETURNED / REVERSED / UNKNOWN|Source of truth is lender event or permitted bank evidence. Hospital<br>receipt confirmation is separate.|
|Receipt|NOT_REQUESTED / AWAITING_HOSPITAL / CONFIRMED /<br>MISMATCH / DISPUTED|Hospital receipt is not inferred from lender disbursement response.|



### **7.3 Transition implementation rules** 

- State transition is enforced in domain service, not only in UI. Invalid transitions return stable 409 errors. 

- Keep append-only state history; current status is a convenience projection. 

- Store raw lender status and canonical mapped status with mapper/product version and source timestamp. 

- Unknown partner status becomes UNKNOWN_MAPPING exception; never map unknown to approved/paid. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 17 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

- Manual corrections require source evidence, reason, maker and checker where financial state is affected. Corrections/reversals create new events; never delete source events. 

##### **SEPARATE LIFECYCLE** 

LSP case closure, hospital bill closure and NBFC loan-account closure are separate. The platform must not imply one from another. 

## **8. Database design and entity mapping** 

### **8.1 Data design principles** 

- Use UUID primary keys for internal records. Human-readable FRID is a display/support reference only; it is not a credential or bearer token. 

- Use foreign keys, unique constraints, check constraints and optimistic row_version for mutable aggregates. 

- Use NUMERIC/DECIMAL for monetary values and rates; never FLOAT/REAL/DOUBLE. Every amount carries currency and source. 

- Persist event timestamps in UTC; preserve source timestamp and received_at for partner events; display in Asia/Kolkata. 

- Use append-only event tables for audit, consent, lender callbacks, state transitions and financial events. 

- Default document mode is NO_LSP_STORAGE or EXTERNAL_REFERENCE. Actual file storage requires approved document class, purpose, access, retention and deletion design. 

- Use JSON/JSONB for versioned partner payloads only where schema flexibility is required; core domain relationships stay relational. 

### **8.2 Entity relationship diagram** 



<!-- Start of picture text -->
CCORE ENTITY RELATIONSHIPS— SIMPLIFIED<br><!-- End of picture text -->

_Figure 4. Simplified relationship map. Parent blueprint contains the complete logical entity catalogue and relationship/cardinality list._ 

### **8.3 Full entity catalogue from master blueprint** 

|**Entity**|**Purpose**|**Key fields / references**|**Owner / source**|
|---|---|---|---|
|Organisation|Legal or operating entity: LSP, hospital,<br>lender, service provider.|org_id, org_type, legal_name, registration refs, status, effective<br>dates.|LSP master; external evidence verified.|
|HospitalBranch|Physical hospital branch/service<br>location.|branch_id, org_id, address, contact, code, service status.|Hospital confirmed.|
|BeneficiaryAccount|Verified hospital bank account for<br>specific end-use disbursement.|beneficiary_id, branch_id, account holder, bank, IFSC, masked<br>account, verification status, effective period.|Hospital evidence plus LSP verification;<br>lender validation.|
|User|Authenticated<br>workforce/hospital/borrower identity.|user_id, identity type, contact, status, auth factors, last login.|LSP identity system.|
|Membership|User-to-organisation/branch link.|membership_id, user_id, org_id, branch_id, role, status, dates.|LSP/hospital admin with LSP activation.|
|Role / Permission|RBAC template and privileges.|role_id, permissions, policy version, scope.|LSP governance.|
|Patient|Person receiving care.|patient_id, minimum demographic identifiers, verified contact if<br>required.|LSP minimal data; avoid clinical record.|
|Borrower|Loan applicant/obligor identity<br>reference.|borrower_id, user_id, lender customer ref, verified contact.|LSP account reference; lender owns<br>KYC record.|
|CaseParty|Participant-role link to case.|case_party_id, case_id, party_id, role, relationship, visibility scope.|LSP.|
|FinancingCase|One hospitalisation/treatment financing<br>service episode.|case_id, hospital_id, branch_id, patient_id, borrower_id, case<br>status, source, executive, created_at.|LSP case system.|
|FRIDInvitation|Borrower-facing link reference and<br>invitation.|frid, case_id, intended contact hash/ref, token hash, expiry,<br>consumed/revoked status.|LSP identity/service layer.|
|HospitalDemand|Payment<br>request/estimate/advance/interim/final<br>demand.|demand_id, case_id, beneficiary_id, amount, currency, type, due<br>date, evidence ref, verifier, state.|Hospital assertion captured by LSP.|
|FundingRequest|Request to lender against one or more<br>permitted demands.|funding_request_id, case_id, demand_id, lender/facility ref,<br>amount, status, borrower auth ref.|LSP process; lender decision source.|
|LenderProduct|Lender-specific medical finance<br>product configuration.|product_id, lender_id, eligibility metadata, supported drawdown<br>mode, fields schema, version.|Lender-approved configuration.|
|LoanApplication|Application attempt to one lender.|app_id, case_id, lender_id, product_id, lender_app_ref, status, raw<br>status, submitted timestamp.|LSP ref + lender source.|
|Offer|Lender-issued product offer.|offer_id, app_id, amount, tenor, APR, EMI, penal charges, offer<br>expiry, KFS ref, version.|Lender authoritative.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 18 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Entity**|**Purpose**|**Key fields / references**|**Owner / source**|
|---|---|---|---|
|Sanction|Lender credit approval and terms.|sanction_id, app_id, terms ref, approved amount, conditions,<br>expiry.|Lender authoritative.|
|Facility|If lender product is a limit/facility.|facility_id, sanction_id, limit, utilised amount, available amount,<br>validity, status.|Lender authoritative.|
|Drawdown|Approved utilisation under a facility if<br>supported.|drawdown_id, funding_request_id, facility_id, approved amount,<br>value date, lender ref, status.|Lender authoritative.|
|Disbursement|Actual funds transfer record.|disbursement_id, drawdown_id or sanction ref, amount,<br>beneficiary, transaction ref, status, value date.|Lender authoritative.|
|LoanAccountReference|Reference for borrower loan account.|loan_account_ref, lender_id, borrower_id, lender account masked<br>ref, status, last_sync_at.|Lender authoritative.|
|HospitalReceipt|Hospital-side evidence that credit was<br>received.|receipt_id, disbursement_id, received amount/date, receipt<br>reference, confirmer, mismatch reason.|Hospital evidence.|
|ConsentRecord|Consent / notice evidence.|consent_id, subject, notice version, purpose, data category,<br>recipient, action, timestamp, channel, withdrawal.|LSP audit evidence; lender retains<br>lender consent.|
|DocumentReference|Allowed document metadata or secure<br>external reference.|doc_ref, case_id, category, issuer, date, hash, storage owner,<br>retention class.|Source party; storage allowed only after<br>approval.|
|Notification|Notice delivery record.|notification_id, recipient, channel, template version, trigger,<br>delivery status, time.|LSP/vendor event.|
|SupportTicket|Support/complaint record.|ticket_id, case_id, complainant, category, lender/hospital party,<br>status, SLA, resolution.|LSP and lender complaint systems as<br>applicable.|
|AuditEvent|Immutable security and business event.|event_id, actor, action, entity, entity_id, before/after hash/ref,<br>timestamp, device, source.|LSP audit store.|
|IntegrationEvent|Inbound/outbound external message.|event_id, partner, event_type, external_ref, idempotency key,<br>payload hash, receipt time, processing state.|LSP integration layer.|
|Exception|Operational or technical anomaly.|exception_id, case_id, category, severity, owner, opened/resolved,<br>evidence and disposition.|LSP operations.|
|ExpenseEntry|Optional personal expense journal item.|expense_id, borrower_id, category, amount, date, note, storage<br>mode.|Borrower only; legal-gated and isolated.|



### **8.4 Relationship and cardinality rules from master blueprint** 

|**Relationship**|**Cardinality**|**Rule**|
|---|---|---|
|Organisation → Branch|1 : many|Only hospital organisations have hospital branches in this domain; lender/LSP may use<br>own organisational structure separately.|
|Organisation → User membership|1 : many|Users may have multiple memberships only where approved.|
|Patient → Financing Case|1 : many|A patient may have multiple episodes over time.|
|Borrower → Financing Case|1 : many|A borrower may finance more than one patient/episode, subject to lender policy.|
|Financing Case → FRID|1 : 1 active; 1 : many historical|Only one active FRID at a time; revoked/expired history retained.|
|Financing Case → Demand|1 : many|Multiple staged demands can exist per episode.|
|Demand → Funding Request|1 : many or 1 : 0..many|Partial funding, retries or separate permitted lender requests may occur; no duplicate<br>active request without idempotency check.|
|Financing Case → Application|1 : many|One case may have applications to different lenders or distinct lender attempts if<br>permitted.|
|Application → Offer|1 : many|Lender may return one or more offers.|
|Application → Sanction|1 : 0..1 or many versions|Lender product determines revisions; preserve versions, do not overwrite original<br>sanction.|
|Sanction → Facility|1 : 0..many|A term loan may have no reusable facility; facility exists only if lender product provides it.|
|Facility → Drawdown|1 : many|Only multi-drawdown products.|
|Drawdown → Disbursement|1 : 0..many|A drawdown may be paid in part or have reversal/return events.|
|Disbursement → Hospital Receipt|1 : 0..many|One disbursement may have confirmations/mismatch/reconciliation events.|
|Financing Case → CaseParty|1 : many|Patient, borrower and other authorised participants are separate roles.|
|Borrower → Expense Entry|1 : many|Optional user-owned personal journal only; not visible to LSP or hospital.|



### **8.5 Physical schema — required tables and primary keys** 

|**Table name**|**Primary key / main foreign keys**|**Notes / constraints**|
|---|---|---|
|organisation|org_id PK|org_type: LSP/HOSPITAL/LENDER/SERVICE_PROVIDER; effective-dated<br>status.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 19 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Table name**|**Primary key / main foreign keys**|**Notes / constraints**|
|---|---|---|
|hospital_branch|branch_id PK; org_id FK|Unique branch code within hospital org; active status.|
|beneficiary_account|beneficiary_id PK; branch_id FK|Store tokenised/encrypted account reference + last4; maker-checker; no<br>full number in logs/UI.|
|app_user|user_id PK|Identity provider reference; do not store unnecessary auth secrets.|
|membership|membership_id PK; user_id/org_id/branch_id FKs|User may have separate memberships and scopes.|
|role_assignment|assignment_id PK; membership/user FK|Role, scope_type/id, policy version, granted_by, approved_by and validity<br>dates.|
|patient|patient_id PK|Minimum patient identifiers only; no clinical record.|
|borrower|borrower_id PK; user_id FK|Borrower identity/account mapping; lender owns KYC source.|
|financing_case|case_id PK; branch_id/patient_id/primary_borrower_id FKs|One hospitalisation/treatment financing service episode; row_version.|
|case_party|case_party_id PK; case_id FK|Patient, primary borrower, co-applicant, guarantor/authorised rep links.<br>One primary borrower in initial release.|
|frid_invitation|invite_id PK; case_id FK|Unique FRID public ref; token_hash; intended contact hash;<br>expiry/consumed/revoked history.|
|hospital_demand|demand_id PK; case_id/branch_id/beneficiary_id FKs|Positive amount, currency, type, due_at, evidence ref, verifier, state,<br>row_version.|
|lender|lender_id PK; org_id FK|Regulatory evidence, partner agreement, grievance contact, active status.|
|lender_product_version|product_version_id PK; lender_id FK|Effective-dated product capability, application schema, drawdown mode,<br>mapped statuses, KFS/consent refs.|
|loan_application|app_id PK;<br>case_id/borrower_id/lender_id/product_version_id FKs|LSP app ID; lender_app_ref; raw and canonical status; source<br>timestamps.|
|offer|offer_id PK; app_id FK|Lender offer version, amount, tenor, APR, EMI, charges/KFS reference and<br>expiry.|
|sanction|sanction_id PK; app_id FK|Lender sanction reference, conditions, amount, expiry and status.|
|facility|facility_id PK; sanction_id FK|Nullable; exists only for lender products with a reusable facility/limit.|
|funding_request|funding_request_id PK; demand_id/case_id/lender_id FKs|One demand per request by default; facility nullable; idempotency key<br>unique.|
|borrower_authorisation|authorisation_id PK; funding_request_id FK|Exact amount, currency, beneficiary, lender auth reference, method,<br>timestamp and expiry.|
|drawdown|drawdown_id PK; funding_request_id/facility_id FKs|Only for supported multi-drawdown product; lender external ref<br>authoritative.|
|disbursement|disbursement_id PK; drawdown_id/app_id/beneficiary_id<br>refs|Lender transfer event, amount, currency, value date, source timestamp<br>and external reference.|
|hospital_receipt|receipt_id PK; disbursement_id FK|Hospital-confirmed amount/date/reference, confirmer, mismatch/dispute<br>state.|
|consent_record|consent_id PK; user_id/case_id refs|Purpose, notice version, data category, recipient, channel, timestamp,<br>action and withdrawal.|
|document_reference|doc_ref PK; case_id nullable FK|Type, source party, storage mode, external ref/hash, retention class and<br>expiry.|
|integration_inbox|inbox_id PK|partner_id + partner_event_id unique where supplied; payload hash,<br>signature result, received/processed state.|
|integration_outbox|outbox_id PK|event type, aggregate ref, payload ref, attempt count and publication<br>state.|
|audit_event|event_id PK|Actor, action, resource, purpose, source, correlation ID, time, before/after<br>hash/reference.|
|notification|notification_id PK; user_id FK|Channel, template version, event ref, provider ref and delivery status.|
|support_ticket|ticket_id PK; case_id nullable FK|Requester, category, priority, owner, SLA due, status and resolution code.|
|expense_entry (optional)|expense_id PK; borrower_id FK|Separate schema/store; borrower-only; feature gated and legally<br>approved.|



### **8.6 Critical relational constraints** 

|**Rule**|**Implementation**|
|---|---|
|No borrower-originated case|Only EXECUTIVE or approved referral-to-executive workflow can create active FinancingCase and FRID.|
|Primary borrower uniqueness|Partial unique index on active case_party where role=PRIMARY_BORROWER; initial release supports one primary borrower<br>unless lender/legal approve co-borrowers.|
|FRID security|Unique FRID public ref. Invitation token separate, high entropy, stored as hash. Token expiry/revocation/consumption<br>immutable history.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 20 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Rule**|**Implementation**|
|---|---|
|Hospital tenancy|Every hospital record is scoped to org_id and branch_id; every lookup filters by authorised tenant scope.|
|Demand integrity|amount > 0; currency required; submitted/verified demand changes require superseding correction event.|
|Funding request traceability|One demand per FundingRequest by default. Bundled demand needs ADR and lender approval.|
|Drawdown validity|No drawdown unless product capability supports it and lender external reference or pending external result exists.|
|Disbursement uniqueness|Unique (lender_id, lender_disbursement_ref) where ref supplied; positive amount; link to app/sanction/drawdown.|
|Receipt independence|HospitalReceipt never overwrites Disbursement. Mismatch requires reason/evidence.|
|Money precision|NUMERIC/DECIMAL values; currency explicit; no binary floating-point.|
|Immutable evidence|Audit, consent, lender callback, financial event and state transitions append; correction creates new record.|



### **8.7 Representative PostgreSQL DDL** 

**Representative schema fragment only; full DDL/migrations still required from engineering** 

CREATE TABLE financing_case ( case_id UUID PRIMARY KEY, branch_id UUID NOT NULL REFERENCES hospital_branch(branch_id), patient_id UUID NOT NULL REFERENCES patient(patient_id), primary_borrower_id UUID NOT NULL REFERENCES borrower(borrower_id), case_status VARCHAR(40) NOT NULL, source_channel VARCHAR(30) NOT NULL, assigned_exec_id UUID REFERENCES app_user(user_id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), closed_at TIMESTAMPTZ, row_version BIGINT NOT NULL DEFAULT 1 ); 

CREATE TABLE hospital_demand ( demand_id UUID PRIMARY KEY, case_id UUID NOT NULL REFERENCES financing_case(case_id), branch_id UUID NOT NULL REFERENCES hospital_branch(branch_id), beneficiary_id UUID NOT NULL REFERENCES beneficiary_account(beneficiary_id), demand_type VARCHAR(40) NOT NULL, amount NUMERIC(19,2) NOT NULL CHECK (amount > 0), currency CHAR(3) NOT NULL, due_at TIMESTAMPTZ, state VARCHAR(40) NOT NULL, row_version BIGINT NOT NULL DEFAULT 1 ); 

CREATE TABLE funding_request ( funding_request_id UUID PRIMARY KEY, demand_id UUID NOT NULL REFERENCES hospital_demand(demand_id), case_id UUID NOT NULL REFERENCES financing_case(case_id), lender_id UUID NOT NULL REFERENCES lender(lender_id), facility_id UUID NULL REFERENCES facility(facility_id), requested_amount NUMERIC(19,2) NOT NULL CHECK (requested_amount > 0), currency CHAR(3) NOT NULL, status VARCHAR(40) NOT NULL, idempotency_key VARCHAR(120) NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now() ); 

### **8.8 Indexing strategy** 

|**Workload**|**Recommended index**|
|---|---|
|Executive cases|(assigned_exec_id, case_status, created_at DESC).|
|Hospital lookup|(branch_id, hospital_reference_normalised); no unrestricted global PII search.|
|FRID link|Unique frid_public_ref; token_hash + expiry/status index.|
|Demand queue|(case_id, state, created_at).|
|Funding requests|(demand_id, status, created_at).|
|Lender application ref|Unique (lender_id, lender_app_ref) where present.|
|Webhook dedupe|Unique (partner_id, partner_event_id); contract-defined fallback hash.|
|Audit investigation|(resource_type, resource_id, occurred_at DESC); (actor_id, occurred_at DESC).|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 21 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

**Workload** 

**Recommended index** 

Support queue (owner_id, status, SLA_due_at). 

## **9. API design and integration contracts** 

### **9.1 API conventions** 

|**Concern**|**Standard**|
|---|---|
|Base path|/api/v1; partner-facing APIs/webhooks versioned separately.|
|Transport|HTTPS JSON; signed webhooks; secure file exchange only where partner contract requires.|
|Authentication|Workforce and borrower identity provider tokens; MFA for privileged workforce. Partner auth per lender contract<br>(mTLS/OAuth/signature).|
|Authorisation|RBAC + ABAC + field masking enforced server side on every endpoint and export.|
|Idempotency|Require stable Idempotency-Key for case creation, invitation, lender submission, funding request and drawdown commands.|
|Concurrency|row_version / If-Match on mutable records; stale update returns 409.|
|Pagination|Cursor pagination; configured maximum page size (proposed 100).|
|Timestamp|UTC ISO 8601; preserve source timestamp and received_at; display Asia/Kolkata.|
|Money|Decimal strings in API; NUMERIC/DECIMAL in DB; currency mandatory; no float.|
|Errors|Stable code, safe message, retryable flag, field errors and correlation ID.|
|PII|No PAN/Aadhaar, phone, email, FRID token or document content in URL/query, analytics or normal logs.|



### **9.2 Canonical internal API catalogue** 

|**Resource / endpoint concept**|**Purpose**|**Critical behaviour**|
|---|---|---|
|POST /cases|Create a financing case.|Authenticated executive; duplicate check; create CASE_ID<br>and FRID only after required validation.|
|GET /cases/{caseId}|Retrieve case workspace.|Role/scope check; field-level masking.|
|POST /cases/{caseId}/invitations|Issue borrower invite.|Token expiry, one-time use/revocation, delivery record.|
|POST /frid/link|Link borrower account to existing case.|Validate token, intended contact, borrower identity and<br>consent.|
|POST /cases/{caseId}/demands|Create hospital demand.|Hospital scope, amount validation, evidence and verifier.|
|POST /demands/{demandId}/funding-requests|Create request to lender.|Check lender product capability, facility reference and<br>idempotency.|
|POST /applications|Submit lender application.|Borrower-only consent, schema validation, lender<br>idempotency and external reference.|
|GET /applications/{appId}/status|Retrieve current application status.|Source/last-updated timestamp, raw and normalized state.|
|GET /offers/{offerId}|Retrieve lender offer/KFS reference.|Offer version and expiry; no LSP alteration.|
|POST /funding-requests/{id}/borrower-<br>authorisation|Record lender-approved borrower authorisation.|Authentication evidence, amount and purpose bound to<br>exact request.|
|POST /webhooks/{lenderId}|Receive lender callback.|Signature validation, replay protection, idempotent<br>processing.|
|GET /cases/{caseId}/disbursements|List lender-reported disbursement events.|No LSP calculation of authoritative loan balance.|
|POST /disbursements/{id}/hospital-receipts|Record receipt confirmation.|Hospital user access, amount/date/reference and mismatch<br>path.|
|POST /tickets|Create complaint/support request.|Classification, acknowledgement and ownership.|
|GET /borrower/consents|Retrieve borrower consent history.|Only borrower and authorised compliance access.|



### **9.3 Extended endpoint surface** 

|**Verb**|**Endpoint**|**Caller / key responsibility**|
|---|---|---|
|POST|/api/v1/auth/session|All clients; create authenticated session.|
|POST|/api/v1/cases|Executive only; create case + parties + optional initial demand.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 22 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Verb**|**Endpoint**|**Caller / key responsibility**|
|---|---|---|
|GET|/api/v1/cases/{caseId}|Scoped portal users; field-masked view.|
|PATCH|/api/v1/cases/{caseId}|Executive/Ops; permitted pre-submission correction with row_version.|
|POST|/api/v1/cases/{caseId}/invitations|Executive; secure one-time invite create/revoke/resend.|
|POST|/api/v1/frid/link|Borrower; link to existing case after intended contact verification.|
|POST|/api/v1/cases/{caseId}/demands|Hospital Finance/Executive; capture demand and evidence ref.|
|POST|/api/v1/demands/{id}/verify|Authorised hospital checker; verify/reject/dispute.|
|POST|/api/v1/demands/{id}/funding-requests|Create request only after demand/product/facility checks.|
|POST|/api/v1/funding-requests/{id}/authorisations|Borrower/lender auth flow; bind exact amount and beneficiary.|
|POST|/api/v1/applications|Borrower/controlled assisted flow; submit lender application under consent.|
|GET|/api/v1/applications/{id}/offers|Retrieve lender-issued offers and KFS references.|
|POST|/api/v1/applications/{id}/offer-selection|Borrower; record selection and hand off agreement where supported.|
|POST|/api/v1/webhooks/lenders/{code}|Lender callback edge; signature validation + durable inbox.|
|GET|/api/v1/cases/{id}/financial-events|Read lender-reported drawdown/disbursement and hospital receipt.|
|POST|/api/v1/disbursements/{id}/receipts|Hospital Finance; confirm receipt or report mismatch.|
|POST|/api/v1/support/tickets|Authenticated customer/partner; create complaint/support case.|
|GET|/api/v1/audit/events|Auditor / privileged admin; scoped read-only audit.|
|GET/POST|/api/v1/borrower/expenses|Borrower only; feature flag and separate store required.|



### **9.4 Standard response and error format** 

##### **Canonical internal envelope** 

{ 

"data": { "caseId": "uuid", "status": "BORROWER_LINKED" }, "meta": { "correlationId": "uuid", "requestId": "uuid", "source": "LSP", "asOf": "2026-11-09T10:30:00Z" } } 

{ "error": { "code": "SCOPE_FORBIDDEN", "message": "You are not authorised to access this record.", "retryable": false, "fieldErrors": [], "correlationId": "uuid" } } 

### **9.5 Case create payload — illustrative** 

##### **Exact required fields depend on approved lender schema and hospital protocol** 

POST /api/v1/cases Idempotency-Key: stable-create-operation-key { "hospitalBranchId": "uuid", "patient": { "fullName": "Example Patient", "hospitalReference": "HOSP-REF-123" }, "primaryBorrower": { "fullName": "Example Borrower", "contactRef": "verified-contact-ref", "relationshipToPatient": "SELF" }, "initialDemand": { "type": "ADMISSION_ADVANCE", "amount": "100000.00", "currency": "INR", "dueAt": "2026-11-09T15:00:00+05:30" } } 

Response (illustrative): { "data": { "caseId": "uuid", "frid": "HF-7K3M-9Q2P", "caseStatus": "READY_FOR_INVITATION", "invitationId": "uuid" 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 23 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

} } 

### **9.6 FRID / invitation security** 

- FRID is opaque, human-readable reference; never a bearer credential. It must not encode patient name, birth date, phone or hospital details. 

- QR/deep link contains a separate high-entropy one-time token. Store only token hash; raw token is sent once and never logged. 

- Invitation binds case, intended contact reference/hash, permitted action, issuing actor, expiry, consumption and revocation. 

- Link flow verifies contact and borrower identity before revealing case content; required notice/consent must be recorded. 

- Rate-limit FRID/token attempts by IP, device and contact; use generic invalid/expired responses to prevent case enumeration. 

- On resend, revoke previous active token unless a specific policy permits parallel invitations. 

### **9.7 Demand / funding request payloads** 

##### **Illustrative canonical payloads** 

POST /api/v1/cases/{caseId}/demands 

{ 

"demandType": "PRE_PROCEDURE_ADVANCE", 

- "amount": "150000.00", "currency": "INR", 

- "dueAt": "2026-11-10T08:00:00+05:30", 

- "hospitalReference": "HOSP-ADV-0091", 

"evidence": { "storageMode": "EXTERNAL_REFERENCE", "reference": "hospital-ref" } 

- } 

POST /api/v1/demands/{demandId}/funding-requests 

- { 

"lenderProductVersionId": "uuid", 

- "requestedAmount": "150000.00", "currency": "INR", 

- "facilityReference": null, 

"purposeCode": "HOSPITAL_DEMAND" 

} Before FundingRequest creation: demand must be VERIFIED; beneficiary active/verified; request amount within eligible demand balance and lender limit; product capability and facility validity confirmed; no duplicate active request; borrower authentication route available. 

### **9.8 Error codes** 

|**Code**|**HTTP**|**Meaning**|
|---|---|---|
|AUTH_REQUIRED|401|Session missing/expired.|
|MFA_REQUIRED|403|Privileged workforce MFA required.|
|SCOPE_FORBIDDEN|403|No org/branch/case or field access.|
|FRID_INVALID_OR_EXPIRED|422|Generic invalid/expired invitation; no case leakage.|
|CASE_NOT_EXECUTIVE_INITIATED|409|No standalone application permitted.|
|DUPLICATE_CASE_REVIEW|409|Possible duplicate; manual review.|
|DEMAND_NOT_VERIFIED|409|Demand cannot fund until verified.|
|LENDER_PRODUCT_UNSUPPORTED|422|Product does not support this drawdown/funding mode.|
|BORROWER_AUTH_REQUIRED|409|Exact borrower authorisation missing.|
|LENDER_STATUS_UNKNOWN|202|External outcome uncertain; do not duplicate.|
|IDEMPOTENCY_CONFLICT|409|Same idempotency key, different request payload.|
|VERSION_CONFLICT|409|Record changed; reload before update.|
|RATE_LIMITED|429|Retry after server delay.|
|PARTNER_UNAVAILABLE|503|External service unavailable; preserve pending/unknown.|



## **10. External integration and event-processing design** 

### **10.1 Integration catalogue from the master blueprint** 

|**Integration**|**Purpose**|**Data direction**|**Dependency / control**|
|---|---|---|---|
|NBFC / Bank API|Product discovery, application<br>submission/status, offers, KFS/doc refs,<br>sanction, drawdown, disbursement and<br>loan status.|Bidirectional|Lender API contract, security, certification, SLA, consent and field<br>mapping.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 24 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Integration**|**Purpose**|**Data direction**|**Dependency / control**|
|---|---|---|---|
|Lender secure file exchange|Alternative to API where lender supports<br>batch/secure file.|Bidirectional|Encryption, file schema, acknowledgement, duplicate detection and<br>reconciliation.|
|Lender operations portal|Manual fallback / exception handling.|Human-mediated|Approved users; evidence and double check; no password sharing.|
|SMS / email OTP provider|Invitation, verification, status notices and<br>secure links.|Outbound / inbound OTP|Data processor agreement, templates, delivery tracking, sender<br>registration, retention.|
|Push notification provider|Native app status alerts.|Outbound|No sensitive content in notification payload; user preference and privacy.|
|KYC / identity service|Only when lender-authorised and within<br>approved flow.|Bidirectional|Lender owns/approves provider and legal basis; biometric data not stored<br>by LSP.|
|App stores|Native app distribution and update.|Outbound|Security, signing, privacy manifest, app review and version support.|
|Analytics / crash reporting|Operational analytics and stability.|Outbound|No KYC/loan payloads, no FRID/PII in analytics identifiers; vendor review.|
|Hospital portal users|Demand, status, receipt and issue<br>updates.|Bidirectional within portal|No direct hospital system integration; organisation/branch scope.|



### **10.2 Integration principles** 

- No synchronous dependency on a lender during ordinary case creation. Executive case creation and FRID issuance must work even when a lender API is unavailable; lender submission is a later workflow step. 

- Use a lender adapter per regulated lender and product version. Business services call a canonical interface; adapter maps canonical values to that lender's field names, states, signatures and transport. 

- An adapter capability registry must declare supported features: application submit/status, offer/KFS retrieval, e-sign handoff, single disbursement, multiple drawdowns, cancellation, reversal, statement/repayment feed and callbacks. Unsupported capabilities must be explicit and fail closed. 

- Never infer a lender outcome from a timeout. Record UNKNOWN/PENDING_RECONCILIATION and query the lender or use signed callback/file confirmation before any retry that could duplicate a financial action. 

- External partner data is untrusted input. Validate schema, identifiers, amount/currency, timestamps, signature and state transition before applying it. 

- Use HTTPS/TLS, mutual TLS or request signing as contracted; secrets are per environment and lender. Rotate keys without downtime through overlapping key IDs where partner supports it. 

- Use a transactional outbox for events generated by database changes. Persist state and outbox row in one DB transaction; workers publish and mark delivery. Consumers use inbox/deduplication. 

- All partner calls carry correlation_id, request_id, idempotency key and partner reference. Do not include raw KYC, health or bank data in correlation metadata. 

### **10.3 Canonical lender adapter contract** 

##### **Canonical interface proposal — remove unsupported methods per lender contract** 

interface LenderAdapter { capabilities(productVersionId): Promise<Capabilities> validateApplication(canonicalApplication): ValidationResult submitApplication(canonicalApplication, idempotencyKey): PartnerSubmission getApplicationStatus(partnerApplicationRef): PartnerStatus getOffers(partnerApplicationRef): PartnerOffer[] 

fetchKfs(partnerOfferRef): DocumentReference 

createAuthorisationContext(fundingRequest): BorrowerAuthContext 

submitDrawdown(drawdownRequest, idempotencyKey): PartnerDrawdownResult 

- getDisbursementStatus(partnerTransactionRef): PartnerDisbursementStatus 

- getLoanSnapshot(partnerLoanAccountRef): LenderLoanSnapshot verifyWebhook(headers, rawBody): SignatureVerification 

normalizeWebhook(event): CanonicalLenderEvent 

} 

##### **IMPORTANT BOUNDARY** 

The interface describes possible adapter methods, not a promise that every lender supports each feature. Do not implement generic drawdown calls unless the signed product contract and lender sandbox prove the capability. 

### **10.4 Webhook ingestion and processing** 

1. Receive raw request at a dedicated partner endpoint; preserve raw bytes for signature verification only in a restricted short-lived processing buffer. 

2. Validate partner identity, signature/MAC, timestamp tolerance, key ID, endpoint environment and content type before trusting the body. 

3. Persist a webhook inbox record with partner_event_id, payload hash, received_at, signature result, correlation metadata and processing state. Enforce unique partner_event_id per partner where available; otherwise use a deterministic deduplication key. 

4. Return partner acknowledgement only after durable persistence. Acknowledge duplicates safely without repeating downstream financial actions. 

5. Normalize event through the correct adapter version, validate transition and amount/currency against the referenced request, then update internal state in a transaction with an audit record and outbox event. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 25 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

6. Unknown references, invalid transitions or amount mismatches go to a quarantine queue for operations/engineering; never silently discard or coerce them. 

7. Use retry with bounded exponential backoff for transient internal processing errors. Poison messages go to DLQ with alert and replay tooling. Replays must remain idempotent. 

8. Webhook status is not the only reconciliation mechanism. Run scheduled status/statement reconciliation to detect missing callbacks. 

### **10.5 Event catalogue from the master blueprint** 

|**Event**|**Producer**|**Consumer / action**|
|---|---|---|
|CaseCreated|Executive portal|ID service, task queue, audit, notification.|
|FRIDIssued|Case service|Invitation service, borrower channel, audit.|
|InvitationConsumed|Borrower identity|Case link service, audit.|
|BorrowerLinked|Identity service|Application workflow, notifications.|
|DemandSubmitted|Executive/hospital portal|Verification queue, operations dashboard.|
|DemandVerified|Hospital verifier / approved protocol|Funding eligibility workflow.|
|ApplicationSubmitted|Borrower / lender adapter|Lender connector, case timeline.|
|LenderStatusReceived|Lender webhook/poll/file|Status mapper, borrower/executive notifications.|
|OfferReceived|Lender|Offer display/KFS retrieval.|
|SanctionReceived|Lender|Sanction record; agreement task.|
|BorrowerAgreementCompleted|Lender|Loan status update.|
|FundingRequestCreated|Executive workflow|Borrower notification/authorisation.|
|DrawdownDecisionReceived|Lender|Drawdown state update.|
|DisbursementEventReceived|Lender|Transaction ledger, hospital notification, reconciliation.|
|HospitalReceiptConfirmed|Hospital portal|Reconciliation and case timeline.|
|DisbursementMismatchRaised|Hospital/ops|Exception queue.|
|ConsentWithdrawn|Borrower|Stop/limit further processing and notify relevant lender.|
|ComplaintCreated|Borrower/hospital/staff|Support and grievance workflow.|



### **10.6 Canonical event envelope** 

**Event envelope; amount and fields are illustrative** 

{ 

"eventId": "uuid", 

"eventType": "DisbursementConfirmed", 

"eventVersion": 1, 

"occurredAt": "2026-11-09T11:15:00Z", 

"recordedAt": "2026-11-09T11:15:03Z", 

"producer": "lender-adapter:partner-code", 

"aggregateType": "Disbursement", 

"aggregateId": "uuid", 

"caseId": "uuid", 

"correlationId": "uuid", 

"causationId": "uuid", 

"partnerEventRef": "partner-event-reference", 

"data": { "amount": "100000.00", "currency": "INR", "valueDate": "2026-11-09" } 

} 

### **10.7 Reconciliation jobs** 

|**Job**|**Frequency / trigger**|**Comparison**|**Exception outcome**|
|---|---|---|---|
|Application status<br>reconciliation|Scheduled; frequency per<br>lender SLA|LSP application ↔ lender application status/reference|UNKNOWN queue; query partner; no duplicate<br>submission.|
|Funding request/drawdown<br>reconciliation|After callback and<br>scheduled|Funding request ↔ approved facility/drawdown<br>reference|Amount/product/facility mismatch queue.|
|Disbursement reconciliation|After each event +<br>scheduled file/API sweep|Lender disbursement ↔ hospital beneficiary and bank<br>reference|Missing, partial, reversed or duplicate transfer<br>alert.|
|Hospital receipt confirmation|Portal action / agreed<br>evidence|Disbursement ↔ hospital receipt confirmation|Pending receipt queue; evidence and escalation.|
|Loan snapshot reconciliation|Per lender feed schedule|Displayed loan information ↔ lender authoritative<br>snapshot|Stale-data warning; suppress stale values if<br>policy threshold exceeded.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 26 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Job**|**Frequency / trigger**|**Comparison**|**Exception outcome**|
|---|---|---|---|
|Webhook completeness|Daily / partner-specific|Partner event or statement references ↔ inbox|Missing callback; fetch partner<br>status/statement.|



## **11. Security, privacy and data governance design** 

### **11.1 Security architecture principles** 

- Deny by default. Every API and background job must prove actor identity, role, organisation/branch scope, case relationship and permitted action. 

- Separate workforce identity from borrower identity. Separate hospital user membership from LSP staff membership. A person may be both patient and borrower, but those are distinct business roles. 

- Use MFA for administrators, operations managers, support/compliance staff and any workforce role with bulk access, user administration or sensitive case visibility. Borrower authentication follows lender-approved assurance and step-up requirements. 

- Use short-lived access tokens, rotating refresh tokens, session revocation, device/session inventory and risk-based rate limits. Store passwords using a modern adaptive password hash; do not store OTPs in plaintext. 

- Encrypt in transit and at rest. Use managed KMS/envelope encryption for secrets and high-sensitivity fields. Restrict database, backup and object-store access to workload identity. 

- No production personal data in development, test, analytics sandboxes, support screenshots or logs. Use synthetic or irreversibly masked data. 

- All privileged access, record export, role change, consent change, FRID issue/revoke, funding authorisation, manual state correction and document access must produce audit events. 

- Use secure software supply chain controls: dependency scanning, secret scanning, SAST, container scanning, SBOM, signed build artifacts and protected deployment approvals. 

### **11.2 Data classification and default storage treatment** 

|**Class**|**Examples**|**Default design treatment**|**Access**|
|---|---|---|---|
|Public|Product explanation, public contact<br>information|Public website only; no case or lender context.|Public|
|Internal|Generic process config, non-<br>sensitive codes|Authenticated workforce; least privilege.|Relevant staff|
|Confidential|Case IDs, hospital branch,<br>application status, operational notes|Encrypt; tenant/branch/case scoping; mask in lists and support.|Assigned actors|
|Restricted personal|Phone, email, address, identity<br>metadata, bank/payment references|Collect minimum; purpose-bound; field masking; tight access;<br>retention schedule.|Explicit role + purpose|
|Highly restricted|KYC image, medical document,<br>detailed health information,<br>credentials, full account identifiers|Do not persist by default. If legally and contractually required:<br>separate encrypted store, narrow service access, malware scan,<br>access reason, expiry and deletion evidence.|Exceptional approved access|



##### **STORAGE DEFAULT** 

The LSP workflow database stores references, metadata, status and consent evidence—not a general patient document vault. Raw KYC/medical files should be collected directly by the NBFC or approved provider whenever possible. Any LSP-side temporary file handling requires a documented legal basis, NBFC approval, storage location, access model, retention and deletion procedure. 

### **11.3 Consent and purpose ledger** 

A consent record must be versioned and independently auditable. It is not a single boolean on the borrower profile. 

|**Field**|**Required semantics**|
|---|---|
|consent_id / subject_id|Unique immutable consent record and the verified person who gave it.|
|purpose_code|Specific action: case linking, data sharing with named lender, KYC handoff, application submission, lender offer retrieval,<br>optional notification or optional expense feature.|
|recipient|Named NBFC/RE or named service provider, where required.|
|notice_version / language|Exact notice and language shown at the time of consent.|
|action / evidence|Affirmative action, timestamp, channel, session/device evidence and authentication method; never infer from continued<br>app use.|
|scope / fields|Data categories and case/application to which the consent applies.|
|withdrawal / expiry|Withdrawal event, effective time, downstream notification and any permitted legal retention exception.|
|status|PENDING, GRANTED, REFUSED, WITHDRAWN, EXPIRED, SUPERSEDED.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 27 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

### **11.4 Document handling lifecycle** 

1. Prefer redirect/SDK/deep handoff to lender-approved KYC and e-sign flows so the NBFC/provider receives documents directly. 

2. If a file must briefly transit the LSP: require explicit purpose and consent; use signed, short-lived upload URL; enforce file size/type allowlist; validate MIME by content; malware scan; encrypt; keep it private; do not expose public object URLs. 

3. Store document metadata only where permitted: document reference, issuer/source, purpose, hash, upload time, verification status and expiry; never place raw contents or identity numbers in application logs. 

4. Delete temporary copies when transfer/verification completes or the approved expiry elapses. Log deletion result. Backups must expire under documented backup-retention schedule. 

5. Re-download and document viewing must require case scope, purpose and access audit. Disable bulk download unless expressly approved. 

### **11.5 Audit design** 

Audit events are append-only at the application level, time-synchronised and protected from update/delete by ordinary application roles. Corrections create compensating events rather than rewriting history. 

|**Event family**|**Examples**|
|---|---|
|Identity/access|Login success/failure, MFA, session revoke, privilege change, denied access, account disable.|
|Case|Create, duplicate review, FRID issue/link/revoke, party role change, case close/reopen.|
|Consent|Notice displayed, grant/refusal, withdrawal, recipient/scope, lender handoff.|
|Financial workflow|Demand submit/verify/reject, funding request, authorisation, lender submission, status callback, drawdown, disbursement,<br>reversal, receipt.|
|Data access|Sensitive record view, document access/export, report download, field reveal, bulk search.|
|Administration|Lender product capability edit, integration key rotation, feature flag, config deployment, manual override.|



### **11.6 Privacy and regulatory implementation gates** 

|**Control area**|**Product implication**|**Implementation evidence**|
|---|---|---|
|LSP contractual arrangement|Every digital lending relationship must be governed by a written<br>NBFC-LSP agreement defining roles, rights and obligations.|Signed agreement, scope, service schedule, data schedule, SLA,<br>audit rights, exit and grievance schedules.|
|NBFC due diligence and<br>oversight|NBFC performs enhanced due diligence of LSP capability,<br>privacy/storage, borrower conduct and compliance; LSP conduct is<br>periodically reviewed.|Diligence pack, security reports, policies, training, issue log,<br>periodic review.|
|Lender accountability|Outsourcing does not absolve NBFC of regulatory obligations; NBFC<br>remains responsible for LSP acts/omissions within arrangement.|Clear responsibility matrix, escalation and incident cooperation.|
|Multiple lender arrangement|When LSP has multiple lender agreements, digital view of matching<br>offers and unmatched lender names, consistent documented<br>matching, objective comparative disclosures and KFS link are<br>required.|Versioned matching policy, full offer audit, fairness tests and<br>disclosure screenshots.|
|Creditworthiness|Lender obtains economic profile including at minimum age,<br>occupation and income; credit assessment is lender-controlled.|Lender-owned application fields and decision record; LSP cannot<br>override.|
|Disclosures|Lender provides KFS and digitally signed loan<br>documents/terms/account statements through verified contact as<br>required.|Lender document reference and delivery status; borrower access.|
|Disbursal and repayment|Specific end-use loan may be disbursed directly to end-beneficiary<br>where permitted; LSP must not control fund flow. Borrower<br>repayments go directly to NBFC, without LSP pass-through<br>account.|Funds-flow diagram, bank-account restrictions, lender contract<br>and transaction logs.|
|LSP compensation|LSP fees/charges/reimbursements payable by NBFC are paid<br>directly by NBFC and not separately charged/collected from<br>borrowers.|Commercial contract and borrower payment audit.|
|Cooling-off|Borrower has explicit exit option during lender-set cooling-off<br>period, not less than one day, with proportionate APR treatment;<br>any retained one-time processing fee must be disclosed.|Lender config, KFS content, borrower UI and test.|
|Grievance|NBFC and borrower-facing LSP designate nodal grievance officers;<br>contacts on website/DLA and KFS; lender retains grievance<br>accountability.|Published contacts, complaint form, routing, escalation and<br>reporting.|
|Data collection and consent|Need-based collection, prior explicit consent with audit trail; no<br>access to contacts, call logs, telephony and broad media; one-time<br>access for camera/mic/location only if necessary and specifically<br>consented.|Mobile permission manifest, consent ledger and data map.|
|Storage restrictions|LSP does not store borrower personal information except basic<br>minimum (e.g. name, address, contact) required within agreement;<br>lender responsible for ongoing privacy/security.|Data inventory, field-level ownership, retention schedule, vendor<br>controls and storage approval.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 28 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Control area**|**Product implication**|**Implementation evidence**|
|---|---|---|
|Localisation|NBFC ensures data stored only on servers in India; if processed<br>outside India, deleted offshore and brought back within prescribed<br>24-hour condition.|Cloud region configuration, vendor/subprocessor register and<br>data-flow assessment.|
|DLA reporting|NBFC reporting of LSP-operated DLA to RBI/CIMS as required.|Partner confirms DLA listing and reporting responsibility; maintain<br>exact app/web identifiers.|
|Recovery|LSP must not engage in recovery unless separately authorised,<br>contractually scoped, trained and compliant.|Default state: no collections/recovery by LSP; any future scope<br>requires legal and lender sign-off.|



**The master blueprint and this TDS are product/engineering design aids, not legal opinions. Before production, counsel and each NBFC partner must validate the current RBI framework, applicable DPDP commencement/transition provisions, lawful purpose, notices, retention/deletion, grievance responsibilities, data sharing, cross-border processing, audit rights and incident reporting. Store the reviewed legal position and effective date in the compliance register.** 

## **12. Operating model, queues and runbooks** 

### **12.1 Queue model** 

|**Queue**|**Entry condition**|**Owner**|**Exit condition / evidence**|
|---|---|---|---|
|New case validation|Executive saves case; validation incomplete<br>or duplicate suspected.|Executive / Ops|Required fields complete; duplicate disposition recorded.|
|Borrower linking|FRID invitation issued; link not completed.|Executive / Borrower support|Identity/contact verified; invitation linked or expired/revoked.|
|Application completion|Linked borrower has required lender inputs<br>pending.|Executive / Borrower|Lender schema validations passed and consent captured.|
|Lender pending / unknown|Submission accepted, callback delayed or<br>transport outcome unclear.|Ops + Integration monitoring|Lender status queried/confirmed; no duplicate submission.|
|Demand verification|Hospital demand submitted but evidence or<br>beneficiary checks pending.|Hospital Finance / Executive|Demand verified, rejected or cancelled with reason.|
|Borrower authorisation|Funding request awaits borrower<br>step-up/authentication.|Borrower; Executive assists|Exact amount, beneficiary and purpose authorised or request<br>expires.|
|Disbursement pending|Lender approves/initiates disbursement;<br>settlement not confirmed.|Ops + NBFC|Lender confirmation and reference recorded; hospital receipt<br>follow-up opened.|
|Hospital receipt pending|Lender says paid but hospital has not<br>confirmed receipt.|Hospital Finance / Ops|Hospital receipt confirmed or mismatch escalated.|
|Exception / reconciliation|Conflict, duplicate, reversal, mismatch or<br>unrecognised partner event.|Ops Level 2 / Finance /<br>Engineering|Root cause, corrective action, dual approval where needed, audit<br>evidence.|
|Complaint / grievance|Borrower or hospital raises complaint.|Grievance owner / NBFC liaison|Acknowledged, classified, routed, responded and closed within<br>applicable SLA.|



### **12.2 Executive daily operating procedure** 

1. Authenticate with named account and MFA; review assigned queue and stale tasks before creating new cases. 

2. Confirm hospital organisation and branch; identify patient and proposed borrower separately; collect only minimum case data. 

3. Run duplicate checks using authorised matching signals; do not merge records automatically when ambiguity exists. 

4. Create case and issue FRID invitation only after required fields and branch context pass validation. Explain the LSP role and lender decision authority. 

5. Assist with mobile web/app linking; do not type or retain borrower passwords, OTPs, PINs or e-sign credentials. 

6. Capture hospital demands only from an authorised hospital contact or approved evidence; distinguish estimate, advance demand, interim demand and final demand. 

7. Explain every funding request as a new exact amount, beneficiary and purpose. Borrower must authorise using lender-approved flow; executive cannot consent for borrower. 

8. Follow lender state. Do not promise approval, instant disbursement, interest rate or same-day payment unless the lender confirms product and service level. 

9. Confirm lender disbursement reference and separately obtain hospital receipt confirmation. Never mark hospital receipt as confirmed based solely on a lender payment initiation event. 

10. Close or hand over case with complete notes, next action, owner and due time. Never collect family contribution information. 

### **12.3 Hospital onboarding and user administration SOP** 

1. Verify legal hospital entity, branch address, bank beneficiary through lender-approved due diligence, authorised signatories and operating contacts before activation. 

2. Execute hospital participation / operating protocol that clarifies referral, demand evidence, beneficiary validation, portal access, receipt confirmation, privacy, service hours and escalation contacts. 

3. Create a hospital organisation and branch record; assign hospital admin; require named users and MFA; prevent shared desk credentials. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 29 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

4. Provide role-based training and test environment; confirm that hospital users can access only own branch and permitted cases. 

5. Review access periodically and immediately disable departed users or compromised accounts. Retain access approval evidence. 

6. No hospital portal user may approve a loan, change lender product terms, authorise borrower drawdown or view the borrower’s unrelated lender account information. 

### **12.4 Exception runbooks** 

|**Incident**|**Immediate action**|**Owner / escalation**|**Do not**|
|---|---|---|---|
|Lender API timeout after submit|Mark outcome UNKNOWN; preserve idempotency key; query lender<br>by client/partner reference; reconcile before retry.|Ops L2 + integration on-call; lender<br>support.|Create a second application or send<br>a new financial command blindly.|
|Webhook signature invalid|Reject/quarantine; record security event; alert partner integration<br>owner; compare key rotation schedule.|Security + integration owner.|Apply payload or expose partner<br>response to borrower.|
|Duplicate callback|Return safe acknowledgement; deduplicate by partner event<br>reference/hash; verify existing state.|Automated inbox worker.|Create duplicate drawdown or<br>disbursement.|
|Amount mismatch|Freeze affected workflow from further funding; preserve both<br>requested and lender-reported amounts; retrieve lender evidence.|Ops L2 + Finance + lender.|Silently overwrite amount or assume<br>rounding.|
|Hospital says payment not<br>received|Capture hospital statement/reference/time; check lender<br>UTR/status, beneficiary details and bank settlement; open case.|Ops + hospital finance + NBFC.|Mark hospital receipt confirmed.|
|Disbursement reversal/return|Record reversal as separate financial event; refresh loan snapshot<br>with lender; notify authorised parties.|Ops + NBFC + Finance.|Delete original disbursement event.|
|Borrower disputes<br>authorisation|Suspend further request processing where possible; preserve<br>evidence; notify lender grievance route immediately.|Grievance officer + NBFC.|Treat executive statement as<br>substitute for borrower evidence.|
|FRID shared / suspected<br>compromise|Revoke invitation; terminate link session; reissue new token after<br>identity/contact verification.|Executive supervisor + security.|Reuse compromised token.|
|Hospital user accesses wrong<br>case|Block session and access; preserve audit; investigate scope<br>configuration and notify privacy/compliance lead.|Security + hospital admin.|Edit/delete audit trail.|
|Service outage|Activate incident command, status communications and safe<br>manual fallback only if documented and approved.|Incident commander.|Capture OTPs, passwords or<br>financial approvals on<br>paper/WhatsApp.|



### **12.5 Manual fallback rules** 

##### **CONTROLLED FALLBACK ONLY** 

A manual fallback may record a referral or non-binding status note, but must not create a fake loan approval, substitute for borrower consent, change a lender decision, collect lender credentials or route money through the LSP. Back-entered events must identify operator, reason, evidence and timestamp; high-impact corrections require maker-checker approval. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 30 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **13. Non-functional requirements and service objectives** 

_The following targets are inherited from the master blueprint. Targets are proposed service objectives until validated against actual volume, lender dependencies, cloud architecture and operating budget. External lender latency must be reported separately from LSP-controlled processing time._ 

|**ID**|**Quality attribute**|**Requirement / proposed target**|**Verification**|
|---|---|---|---|
|NFR-001|Availability|Target 99.9% monthly availability for core case, borrower link and executive<br>services, excluding planned maintenance and external lender outages.|Monitoring and monthly availability report.|
|NFR-002|Performance|95th percentile page/API response under 2.5 seconds for normal read<br>operations and under 4 seconds for standard writes, excluding external<br>lender calls.|Load test under agreed concurrent-user profile.|
|NFR-003|External dependency<br>latency|External lender calls have explicit timeout, retry, circuit breaker and<br>UNKNOWN state; no UI spinner indefinitely.|Simulated timeout and recovery tests.|
|NFR-004|Mobile performance|Borrower mobile web usable on mid-range Android devices and<br>constrained 4G; avoid oversized assets and mandatory app install.|Real-device performance tests.|
|NFR-005|Scalability|Horizontal scale for stateless API/workers; isolate lender connector load<br>from main case service.|Load and soak test at agreed volume plus<br>headroom.|
|NFR-006|Security in transit|TLS 1.2+ (prefer TLS 1.3 where available) for all network connections;<br>secure certificate management.|TLS scan and configuration review.|
|NFR-007|Encryption at rest|Use strong managed encryption for databases, backups and permitted<br>document storage; keys managed separately.|Cloud configuration and key-access audit.|
|NFR-008|Secrets management|No API keys, credentials or signing secrets in source code, client apps or<br>plain config.|Secret scanning and vault audit.|
|NFR-009|Authentication|MFA mandatory for privileged workforce roles; short-lived access tokens;<br>secure refresh and revocation.|Auth penetration and session tests.|
|NFR-010|Authorisation|RBAC + ABAC + field-level masking enforced server-side on every API and<br>export.|Automated cross-tenant and privilege<br>escalation suite.|
|NFR-011|Auditability|Critical events append-only/tamper-evident with actor, action, entity, time,<br>source, reason and correlation ID.|Audit completeness sampling.|
|NFR-012|Privacy / minimisation|Collect only purpose-required information; no broad contacts, call logs,<br>telephony or media access.|Mobile permission audit and data inventory.|
|NFR-013|Data localisation|Where RBI NBFC digital lending requirements apply, lender/LSP data<br>storage/processing controls must meet applicable India localisation and<br>transfer conditions.|Data-flow map, cloud-region evidence, vendor<br>attestations.|
|NFR-014|Retention/deletion|Configurable retention schedules by data class and legal/contract basis;<br>legal hold and deletion evidence.|Scheduled deletion test and audit report.|
|NFR-015|Consent traceability|Consent captured with notice version, purpose, data categories, recipient,<br>timestamp and withdrawal status.|Reconstructable consent audit.|
|NFR-016|Idempotency|All create/submit/payment-status endpoints safe against duplicate<br>requests and repeated webhooks.|Replay and duplicate-submission tests.|
|NFR-017|Resilience|Proposed RPO ≤ 15 minutes and RTO ≤ 4 hours for core case service,<br>subject to cloud architecture and budget approval.|Disaster recovery exercise.|
|NFR-018|Backup|Encrypted automated backups; restore test at least quarterly and after<br>material architecture changes.|Successful restore record.|
|NFR-019|Observability|Central metrics, traces and structured logs; correlation IDs across<br>case/lender journeys; PII and secrets redacted.|Redaction and tracing tests.|
|NFR-020|Accessibility|Target WCAG 2.2 AA for core borrower web flows; keyboard/screen-reader<br>support for critical forms.|Automated and manual accessibility audit.|
|NFR-021|Compatibility|Support current and previous two major versions of Android/iOS where<br>native app is released; agreed browser matrix for mobile web.|Device/browser regression suite.|
|NFR-022|Localization|Architecture supports English and additional Indian languages;<br>legal/financial wording must be translated and approved, not machine-<br>translated without review.|Language QA and consistency checks.|
|NFR-023|Maintainability|Domain modules, documented APIs, code review, automated tests,<br>migration scripts and architecture decision records.|Engineering review and maintainability<br>checklist.|
|NFR-024|Secure development|Threat modelling, dependency scanning, SAST/DAST, secrets scan, code<br>review and independent VAPT before production.|Signed security release report.|
|NFR-025|Mobile app security|Certificate pinning where appropriate, jailbreak/root risk assessment,<br>secure local storage, anti-tamper controls and no hard-coded secrets.|Mobile VAPT and OWASP MASVS-aligned review.|
|NFR-026|Document handling|Allowed file types, malware scan, size limits, checksum, access expiry,<br>audit and no public object URLs.|Upload/download security tests.|
|NFR-027|Financial precision|Store monetary values exactly with currency and source; no floating-point<br>amount calculations.|Boundary and reconciliation tests.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 31 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**ID**|**Quality attribute**|**Requirement / proposed target**|**Verification**|
|---|---|---|---|
|NFR-028|Time accuracy|Use UTC event timestamps, preserve source timestamps and display local<br>Asia/Kolkata time consistently.|Timezone / DST / clock-skew tests.|
|NFR-029|Vendor portability|Avoid business rules embedded in one cloud/vendor-specific UI or<br>notification provider; connector abstraction for replacements.|Architecture dependency review.|
|NFR-030|Configuration<br>governance|Lender terms, field schema, status mapping and notice text are versioned,<br>approved and effective-dated.|Historical replay/reconstruction test.|
|NFR-031|Data quality|Required reference fields, referential integrity, duplicate controls and<br>reconciliation exceptions.|Data quality dashboard and daily exception<br>review.|
|NFR-032|Notification privacy|Default lock-screen/SMS content avoids sensitive medical, financial or<br>identity details.|Template security review.|
|NFR-033|Human factors|Critical actions clearly distinguish request, approval, disbursement and<br>receipt; no ambiguous green “success” until source confirms.|Usability test with staff and borrowers.|
|NFR-034|API versioning|Version public/partner APIs; backward compatibility and deprecation<br>notice agreed with partners.|Contract tests across versions.|
|NFR-035|Operational<br>supportability|Admin tools expose actionable error codes, timestamps, correlation IDs<br>and safe retry controls.|Support scenario simulation.|
|NFR-036|Data export control|Exports are minimised, scoped, watermarked where appropriate, time-<br>limited and logged.|Export permission and audit test.|



### **13.1 SLO measurement rules** 

- Availability is measured at the public API and user-journey level from synthetic probes plus production telemetry; planned maintenance and external partner outage treatment must be stated transparently. 

- Latency separates LSP processing from end-to-end lender elapsed time. Report p50, p95 and p99 by endpoint and partner; never hide slow lender responses in overall platform averages. 

- Financial workflow correctness is more important than eventual consistency speed. No eventual-consistency window may permit duplicate disbursement commands, unauthorised drawdowns or incorrect beneficiary changes. 

- RPO/RTO, backup frequency and restore test cadence must be approved based on actual lender/hospital operating commitments. Targets from the blueprint are copied but require architecture validation. 

- Accessibility, localisation and low-bandwidth behaviour must be tested on real target devices and assistive technology; do not certify based only on automated scans. 

### **13.2 Capacity and load-test model** 

|**Dimension**|**Design approach**|**Evidence required before production**|
|---|---|---|
|Concurrent workforce users|Model executive/ops/hospital/admin peak shifts; include burst login<br>and case searches.|Pilot usage profile and peak multiplier.|
|Borrower traffic|Model bursts when a hospital executive sends many FRID<br>invitations at once; OTP provider quotas are a separate constraint.|Invitation/send rate, OTP delivery SLO and throttle policy.|
|Partner traffic|Separate per-lender concurrency limits, timeouts and circuit<br>breakers.|Partner sandbox/prod quota, rate limits and callback volume.|
|Database|Measure read/write mix, hot indexes, case history growth,<br>audit/outbox volume and connection pool.|Load test, query plan review and backup restore test.|
|Webhook burst|Test duplicate, out-of-order, delayed and malicious event patterns.|Sustained/peak event rate and DLQ recovery time.|
|Reporting/export|Use scoped asynchronous export for large datasets; no unrestricted<br>full-table reports.|Maximum export size, masking, access and expiry test.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 32 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

## **14. Engineering delivery, environments and deployment** 

### **14.1 Recommended implementation shape** 

##### **PROPOSED, NOT CONFIRMED** 

Start with a modular monolith for the core transactional LSP workflow plus separately scalable background workers. Do not start with many microservices unless independently deployable workload, ownership or scale requirements justify the operational overhead. 



<!-- Start of picture text -->
REFERENCE DEPLOYMENT TOPOLOGY — CLOUD NEUTRAL<br>FF<br>(Peron cue Hoxtl/Adnn chews)<br>6a)<br>(CON / WAE / PI gateway<br>xJ<br>a<br>( Private app runtime »)<br>sr wat ee etn Je $$<br>7 syne workers \ \ ILS / signed requests webhooks via edge<br>—— Es : \ +44<br>[Fane] uve ever ns (esS59" | [ies scasmnee | ) (nersrnan me<br>{[ tox mee ces Jp—— ————<br><!-- End of picture text -->

_Reference cloud-neutral deployment. Provider, region, managed services and network design remain open architecture decisions._ 

|**Component**|**Responsibility**|**Deployment / boundary**|
|---|---|---|
|Web frontends|Admin, operations, executive and hospital portals; borrower mobile<br>web.|Static hosting/CDN + WAF; same identity edge; strict CSP.|
|Native app|Optional patient companion; no separate loan-originating path.|iOS/Android clients; API-only; secure local storage; feature<br>flags.|
|API application|Business rules, RBAC/ABAC, case/demand/funding orchestration.|Private container/application runtime; stateless replicas.|
|Background workers|OTP notifications, partner calls, webhook normalization,<br>reconciliation, exports.|Separate worker pools and queue concurrency per<br>partner/task.|
|Relational DB|Transactional source for LSP workflow records.|Managed HA relational database; private network; encrypted<br>backups.|
|Queue + outbox/inbox|Durable asynchronous jobs and events.|Managed queue/event service; DLQ and replay controls.|
|Object storage|Only approved temporary/permitted files.|Private bucket, short-lived signed URLs, KMS, lifecycle<br>deletion.|
|Secrets/KMS|API keys, partner credentials, signing keys and encryption keys.|Managed secrets and key service; no secrets in code or CI<br>logs.|
|Observability|Logs, metrics, traces, audit monitoring and alerts.|Centralised platform with PII filtering and restricted access.|



### **14.2 Environment separation** 

|**Environment**|**Purpose**|**Allowed data / controls**|
|---|---|---|
|Local development|Individual development and unit tests.|Synthetic data only; local secrets via developer vault; no production<br>network access.|
|Shared development|Integration among engineering contributors.|Synthetic seed data; feature branches; limited partner sandbox<br>credentials.|
|QA / test|Regression, security, performance and UAT.|Synthetic or irreversibly anonymised data; test lender/hospital identities.|
|UAT / partner sandbox|NBFC/hospital scenario certification.|Partner-approved sandbox data; controlled access; separate<br>endpoint/key set.|
|Staging|Production-like release rehearsal.|No live customer data unless explicitly approved, minimized and legally<br>justified.|
|Production|Live regulated workflow.|Least privilege, MFA, approvals, monitoring, backups, incident and DR<br>controls.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 33 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

### **14.3 CI/CD pipeline gates** 

1. Pull request: formatter/linter, unit tests, type checks, dependency and secret scans, migrations validation, static analysis, API schema compatibility. 

2. Build: pinned dependencies, reproducible container, SBOM, image scan, signed artifact and immutable digest. 

3. Deploy to test: apply backward-compatible migrations, smoke tests, integration contract tests and DAST where applicable. 

4. Pre-production: regression suite, role/tenant isolation tests, load tests, backup/restore evidence, security review, lender certification and operational runbook sign-off. 

5. Production: approved change ticket, staged rollout/canary, health gates, rollback plan and post-deploy verification. 

6. Database migrations: expand-migrate-contract pattern; do not deploy destructive schema changes before every running application version is compatible. 

7. Feature flags: server-side flags for native app, expense journal, lender product capabilities and partner channels; flags must not bypass authorisation or consent. 

### **14.4 Backup, disaster recovery and business continuity** 

- Back up relational database, object metadata and critical configuration with encrypted, immutable or deletion-protected copies where feasible. 

- Test restore into an isolated environment on an agreed cadence. A successful backup job without restore evidence is not proof of recoverability. 

- Define RPO/RTO per service and partner contract. Keep lender and hospital contact procedures for prolonged outage. 

- Recovery must preserve idempotency keys, event inbox/outbox, audit history and transaction references to prevent duplicate financial commands after failover. 

- Run a tabletop exercise for lender outage, cloud-region outage, credential compromise, ransomware and data breach. 

### **14.5 Release gates** 

|**Gate**|**Required evidence**|**Approver**|
|---|---|---|
|Product readiness|Scope and open decisions accepted; screens and role permissions signed off.|Product owner / founder|
|Lender readiness|Signed LSP/product agreement; API/product spec; KFS and borrower journey; sandbox certification.|Partnerships + Compliance +<br>NBFC|
|Hospital readiness|Beneficiary verification, portal users, branch scope, demand/receipt protocol and trained contacts.|Hospital admin + Operations|
|Security/privacy readiness|Threat model, VAPT, privacy review, access controls, retention/deletion, incident process.|Security + Compliance|
|Operational readiness|Queues, SOPs, escalation roster, grievance handling, reconciliation jobs and runbooks.|Operations head|
|Technical readiness|CI/CD, monitoring, restore test, rollback, performance and acceptance suite pass.|Engineering owner + QA|



## **15. Verification, test strategy and acceptance** 

### **15.1 Test layers** 

|**Layer**|**What is verified**|**Minimum test evidence**|
|---|---|---|
|Unit|Domain validation, state transitions, money arithmetic, consent state,<br>token expiry, policy evaluation.|Deterministic tests; boundary and property-based tests for<br>amounts/state transitions.|
|Component|Repository, queue, outbox/inbox, notification and adapter behaviour.|Containerised dependencies; fault injection; deduplication<br>tests.|
|Contract|Lender API/webhook schemas, signatures, error mapping and versioning.|Partner sandbox plus recorded synthetic contract fixtures.|
|Integration|End-to-end LSP flows across portal, API, DB, queue, notification and<br>lender sandbox.|Trace IDs and persisted state assertions.|
|Security|Authentication, RBAC/ABAC, tenant isolation, IDOR, injection, file<br>handling, session and secrets.|Automated DAST/SAST plus manual penetration test and role-<br>matrix tests.|
|Performance|API p95/p99, case creation bursts, FRID invitation bursts, webhook<br>ingestion, database contention.|Load profile and capacity report.|
|Operational / recovery|Lender outage, duplicate callback, unknown transaction, DLQ replay,<br>restore, failover.|Runbook rehearsal and incident evidence.|
|UAT|Executive, hospital finance, borrower and admin workflows.|Signed scenario scripts and defect disposition.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 34 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

### **15.2 Acceptance scenarios from the master blueprint** 

|**Test ID**<br>AT-01|**Scenario**<br>Executive creates valid case|**Pass condition**<br>Valid hospital/branch and patient/borrower create case; CASE_ID and FRID are<br>generated; no HMS call occurs.|
|---|---|---|
|AT-02|App user without FRID tries to apply|System does not create application; shows guidance to visit desk/obtain executive<br>invitation.|
|AT-03|Valid borrower links FRID|Secure link verifies intended contact; case visible only after successful link and<br>notice/consent.|
|AT-04|FRID guessed or reused|Rate limit/block; no case details disclosed; security event logged.|
|AT-05|Patient differs from borrower|Separate party identities and permissions; patient does not see borrower financial info<br>by default.|
|AT-06|Borrower declines consent|Application sharing stops; system records decline and does not submit to lender.|
|AT-07|Lender API timeout after submit|Application state becomes pending/unknown; idempotent status check prevents<br>duplicate submission.|
|AT-08|Multiple lender offers|All matching offers and unmatched lenders displayed as required; fair comparison and<br>KFS links available.|
|AT-09|Lender rejects application|Case reflects lender-provided decline; no user can manually change decision.|
|AT-10|Lender sanctions single-disbursement product|System does not permit later tranche as if facility exists; directs to lender-approved<br>new application route.|
|AT-11|Lender supports multiple drawdowns|Funding request bound to demand, borrower authorises exact request, lender<br>approves and provides drawdown reference.|
|AT-12|Hospital demand changes after authorisation|Original demand/request history preserved; change requires lender-defined<br>amendment/cancellation path.|
|AT-13|Disbursement confirmed but receipt absent|Lender status and hospital receipt remain distinct; mismatch exception opens.|
|AT-14|Disbursement fails/returns|Original record retained; return/reversal event linked; borrower/executive notified<br>appropriately.|
|AT-15|Hospital tries to access another hospital case|Access denied at API; no data leakage; audit event logged.|
|AT-16|Hospital user requests KYC document|Access denied; support does not bypass without formal legal/partner approval.|
|AT-17|Executive tries to enter borrower OTP|Workflow/training prohibits; no OTP field is available to staff; event escalates if<br>attempted.|
|AT-18|Hospital beneficiary account change|Change held pending independent verification and maker-checker approval.|
|AT-19|Borrower installs app after web start|Secure deep link resumes linked case without new case/FRID or exposing token in<br>analytics.|
|AT-20|Borrower uses mobile web only|Full core application journey works without app installation.|
|AT-21|Expense journal feature disabled|No UI/API/storage for journal is available; no personal expense data collected.|
|AT-22|Expense journal approved and enabled|Journal remains borrower-only; not visible to hospital, executive, lender or analytics;<br>deletion and consent work.|
|AT-23|Borrower complaint is lender-related|Ticket routed to correct NBFC grievance channel and tracked; LSP complaint<br>accountability remains.|
|AT-24|Staff deactivated|Sessions/tokens revoked and case history retained; reassignment queue gets tasks.|
|AT-25|Daily reconciliation mismatch|Exception owner assigned; source evidence required; no unauthorised manual<br>correction.|
|AT-26|Consent withdrawal|Future optional sharing stops; partner is notified as required; mandatory records<br>retained per legal basis.|
|AT-27|LSP case closed while loan active|Case service closure does not update lender loan status to closed.|
|AT-28|Concurrent webhook retries|Only one financial event is applied; duplicate event logged as duplicate.|
|AT-29|Data export requested by executive|Export denied unless permission and approval; sensitive fields masked and export<br>audited.|
|AT-30|Data breach simulation|Incident response opens, systems are contained, owners and notification assessment<br>recorded.|



### **15.3 Additional technical negative and boundary tests** 

|**Test ID**|**Scenario**|**Expected result**|
|---|---|---|
|TDS-001|Borrower opens app and tries to apply without an executive-created<br>FRID.|No case/application is created; safe guidance directs borrower to hospital desk<br>or an authorised invitation.|
|TDS-002|A valid FRID is replayed after it has been consumed or revoked.|Link denied; no case data exposed; audit event created.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 35 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Test ID**<br>TDS-003|**Scenario**<br>User from Hospital A requests a Hospital B case by changing UUID<br>in URL.|**Expected result**<br>403; no data leakage; security alert/metric incremented.|
|---|---|---|
|TDS-004|Executive attempts to mark an application APPROVED manually.|Denied; lender-owned state cannot be set by LSP staff.|
|TDS-005|Hospital finance user attempts to read borrower KYC and expense<br>journal.|Denied/masked; access audit captured.|
|TDS-006|Two identical case-create requests arrive concurrently with same<br>idempotency key.|One case/FRID; second returns same result or safe duplicate response.|
|TDS-007|Same idempotency key is reused with a different payload.|409 IDEMPOTENCY_CONFLICT.|
|TDS-008|Lender submit call times out after partner accepted request.|Application state UNKNOWN; reconciliation query; no duplicate submission.|
|TDS-009|Signed webhook arrives twice.|One state transition and one financial event; duplicate acknowledged safely.|
|TDS-010|Webhook has invalid signature or stale timestamp.|Rejected/quarantined; no business state changed.|
|TDS-011|Lender reports amount/currency different from authorised amount.|Quarantine and exception; no silent update or receipt confirmation.|
|TDS-012|A lender product lacks multiple drawdown support.|Funding request rejected as unsupported; no synthetic drawdown object<br>created.|
|TDS-013|Borrower authorises ₹50,000 but executive submits ₹75,000.|Request blocked; authorisation must bind exact amount and beneficiary.|
|TDS-014|Hospital beneficiary bank account changes after verification.|Further disbursement blocked pending re-verification and required approval.|
|TDS-015|Lender says disbursed but hospital marks receipt not received.|Separate statuses retained; reconciliation exception opened.|
|TDS-016|A payment is reversed after hospital receipt confirmation.|Reversal event appended; original events preserved; case escalated.|
|TDS-017|Borrower changes phone number while a FRID invite is pending.|Re-authenticate; revoke or supersede invitation under policy; do not silently<br>relink.|
|TDS-018|Expense tracker feature flag is off.|App hides entry points and API rejects access; no hidden data collection.|
|TDS-019|Borrower tries to enter family contribution in expense journal.|No dedicated family-contribution object or reconciliation feature; generic<br>personal expense entry only if policy permits.|
|TDS-020|Operations user exports full case list without a permitted purpose.|Export denied or minimized/approved; export audit logged.|
|TDS-021|Support agent attempts bulk access to KYC document.|Denied; support role cannot reveal restricted data.|
|TDS-022|Database transaction commits business record but worker crashes<br>before publish.|Outbox worker publishes after restart; no event loss.|
|TDS-023|DLQ message replay is requested twice.|Idempotent processing prevents duplicate financial effect.|
|TDS-024|Stale lender loan snapshot exceeds freshness threshold.|UI shows timestamp/stale warning or suppresses value per approved UX rule;<br>never imply live authoritative balance.|
|TDS-025|Privileged admin removes own role / disables last super admin.|Guardrail prevents orphaned privileged access; dual-admin recovery process.|



### **15.4 Definition of Done** 

- Each requirement has an implementation reference, test ID and owner; unresolved dependencies are not marked complete. 

- All server-side authorization and field masking tests pass for every role and cross-organisation boundary. 

- Financial events are idempotent, auditable and reconcilable; unknown external outcomes have an explicit safe state. 

- No prohibited fund flow, manual credit approval, standalone borrower application or family-contribution handling exists. 

- Security review, privacy/legal approval, partner certification, monitoring, runbooks, restore test and support training are complete. 

- Product, Engineering, QA, Operations, Security/Compliance and NBFC partner approve their respective go-live gates. 

## **16. Architecture decisions and unresolved dependencies** 

### **16.1 Architecture decision records inherited from the master blueprint** 

|**ADR ID**|**Decision**|**Options to evaluate**|**Evidence required**|
|---|---|---|---|
|ADR-001|Case ID and FRID design|Random UUID/ULID, short human-readable code<br>plus secure token.|Guessability, supportability, leakage analysis.|
|ADR-002|Borrower identity and app linking|OTP + invite, lender identity handoff, account<br>linking.|Fraud threat model and lender requirements.|
|ADR-003|Lender integration pattern|API-first, secure files, manual fallback.|Lender contract, availability, security and<br>reconciliation.|
|ADR-004|Event/outbox architecture|Database outbox + queue, managed event bus.|Delivery guarantees, ordering, replay and cost.|
|ADR-005|Document handling|No storage, lender-hosted links, tightly scoped<br>storage.|RBI data rule, lender agreement, malware and<br>retention.|
|ADR-006|Native app technology|Cross-platform or native Android/iOS.|Audience devices, offline requirements, security<br>and maintenance.|
|ADR-007|Expense journal storage|Not offered; local-only; cloud sync.|Legal/NBFC approval, data-fiduciary allocation<br>and security.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 36 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**ADR ID**|**Decision**|**Options to evaluate**|**Evidence required**|
|---|---|---|---|
|ADR-008|Hospital portal referral/demand|View-only first; limited demand submit; referral only.|Hospital contract, staff controls and process|
||functions||validation.|
|ADR-009|Status/event source-of-truth|Webhook, polling, statement reconciliation.|Lender interface and false-positive risk.|
|ADR-010|Analytics data model|Pseudonymous event store vs operational replica.|Privacy, retention and reporting needs.|



### **16.2 Full open-decision register inherited from the master blueprint** 

_The source register is carried forward without treating OPEN items as settled. The business/product owner should assign one named accountable owner and due date to each decision before the affected implementation is committed._ 

|**ID**|**Open question**|**Owner**|**Impact**|**Status**|
|---|---|---|---|---|
|D-001|What exactly triggers executive case creation: referral, admission, first<br>bill or first advance?|Founder + hospital<br>operations|High|OPEN|
|D-002|Can one case have multiple borrowers/co-applicants or only one primary<br>borrower?|Lender + Product|High|OPEN|
|D-003|Who is the legal borrower when patient is a minor/incapacitated?|Legal + lender|Critical|OPEN|
|D-004|Does hospital portal allow referral/demand input or remain view-only<br>initially?|Founder + hospital|High|OPEN|
|D-005|Can hospital finance staff verify all demands or only designated users?|Hospital|High|OPEN|
|D-006|What hospital evidence is sufficient for demand verification?|Hospital + lender|High|OPEN|
|D-007|Can a case have multiple financing applications to different lenders<br>simultaneously?|Lender + legal|High|OPEN|
|D-008|Is multi-lender offer comparison required from day one?|Lender + compliance|High|OPEN|
|D-009|What lender matching criteria and public ranking metric will be used?|Product + compliance|High|OPEN|
|D-010|What lender products support staged/multiple disbursement?|Lender|Critical|OPEN|
|D-011|Does additional utilisation require borrower OTP, digital signature,<br>mandate or new agreement?|Lender|Critical|OPEN|
|D-012|How are interest accrual, EMI reset, tenure and repayment schedule<br>handled after each drawdown?|Lender|Critical|OPEN|
|D-013|Does each drawdown create separate loan account or one account?|Lender|Critical|OPEN|
|D-014|What happens to excess hospital payment / refund and whether it<br>reduces principal?|Lender + hospital + legal|Critical|OPEN|
|D-015|What is definition of lender confirmation vs bank credit confirmation vs<br>hospital receipt?|Lender + hospital|High|OPEN|
|D-016|Can LSP store limited hospital demand documents? Which document<br>classes and retention?|Lender + legal|Critical|OPEN|
|D-017|Will mobile app expense journal be permitted under LSP DLA<br>constraints?|Legal + NBFC compliance|Critical|OPEN|
|D-018|If journal is approved, is on-device-only storage acceptable and what<br>does “storage by LSP” mean in the arrangement?|Legal + lender|Critical|OPEN|
|D-019|Can the app provide a user-selected receipt scan or does this create<br>unacceptable data storage/access?|Legal + lender|High|OPEN|
|D-020|Do patients get any portal access when they are not borrowers?|Founder + legal|High|OPEN|
|D-021|What borrower app identity model and phone-change recovery applies?|Security + lender|High|OPEN|
|D-022|Which NBFCs/banks and exact lender products are targeted?|Founder / Partnerships|Critical|OPEN|
|D-023|What service levels can each lender contractually support?|Lender|High|OPEN|
|D-024|Who signs hospital agreement and owns partner relationship?|Founder + legal|High|OPEN|
|D-025|What is the permitted LSP compensation basis and conflict<br>management?|Lender + legal|Critical|OPEN|
|D-026|Will any insurance claim support be offered? Current scope excludes it.|Founder + legal|Medium|OPEN|
|D-027|What languages are required at initial operating locations?|Product + operations|Medium|OPEN|
|D-028|What are final hosting, cloud region, DR and vendor choices?|Engineering + security|High|OPEN|
|D-029|What is the exact support coverage and escalation roster for hospital<br>hours?|Operations|High|OPEN|
|D-030|Which reports are allowed for hospital users and how long are they<br>retained?|Hospital + privacy|High|OPEN|
|D-031|What is the retention period per event, document, consent, complaint<br>and audit class?|Legal + lender|Critical|OPEN|
|D-032|Which third-party KYC, SMS, eSign, notification and analytics vendors will<br>be engaged?|Engineering + lender +<br>privacy|High|OPEN|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 37 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**ID**|**Open question**|**Owner**|**Impact**|**Status**|
|---|---|---|---|---|
|D-033|Who is data fiduciary / processor for each specific data processing<br>activity?|Legal + lender|Critical|OPEN|
|D-034|What happens when hospital withdraws from network while cases are<br>still open?|Operations + legal|High|OPEN|
|D-035|What is the policy for corrections to patient/borrower identity after<br>application submission?|Lender + operations|High|OPEN|
|D-036|What is the permitted scope of executive support in lender application<br>screens?|Lender + compliance|Critical|OPEN|
|D-037|What are the actual supported ticket-size/tenor/product eligibility bands?|Lender|High|OPEN|
|D-038|What is manual fallback control and evidence standard per lender?|Lender + operations|High|OPEN|
|D-039|What is case closure definition and reopen policy?|Product + operations|Medium|OPEN|
|D-040|What borrower support and lender complaint escalation language is<br>approved?|Lender + compliance|High|OPEN|



### **16.3 Additional technical decisions required** 

|**Decision**|**Options / question**|**Recommended treatment until decided**|
|---|---|---|
|Cloud provider and region|Which provider, region, availability zones, managed DB, queue, secrets,<br>KMS and observability?|Vendor-neutral interfaces; no provider-specific<br>commitment in business rules.|
|Backend framework and frontend<br>stack|Select team-supported framework with security and hiring fit.|Choose after capability review; enforce OpenAPI and<br>domain boundary regardless.|
|Database engine|PostgreSQL or another ACID relational DB?|Prefer mature relational engine; validate JSON/query needs<br>and managed HA.|
|Native app framework|Native iOS/Android vs cross-platform.|Do not block mobile web; native app consumes same<br>versioned APIs.|
|Authentication provider|Managed identity vs in-house IAM.|Prefer managed identity for workforce and customer auth;<br>confirm lender OTP/eKYC handoff.|
|Lender connectivity|API, secure file, portal-assisted/manual status or hybrid per lender.|Adapter abstraction; each partner connection separately<br>certified.|
|Multi-tranche product semantics|Facility drawdowns vs progressive term loan vs separate top-ups.|No product logic hard-coded before signed NBFC product<br>spec.|
|Money precision and currency|Decimal representation, scale, rounding rules and value dates.|Store INR using fixed decimal or integer paise; never float;<br>lender governs interest calculation.|
|Document store|Direct lender upload vs temporary LSP transit.|Direct lender/provider handoff; LSP copy disabled by<br>default.|
|Expense journal|Launch timing, categories, export and retention.|Feature OFF until privacy/legal review; independent from<br>lender ledger.|
|Analytics warehouse|Operational DB reports vs separate analytics store.|No direct broad production DB access;<br>minimize/pseudonymise analytics data.|
|SLA / support hours|Operating hours, on-call, lender escalation, grievance ownership.|Agree with hospital and each NBFC before live<br>commitment.|



## **17. Traceability, engineering handover and governance** 

### **17.1 Requirement-to-implementation traceability** 

|**Baseline requirement group**|**Primary design sections**|**Implementation artifact**|**Verification**|
|---|---|---|---|
|Case/FRID and borrower gate|4, 5, 6, 7, 8, 9|Case service, invitation service, API, screen EXE-02/BOR-02|AT-01/02 + TDS-001/002/006|
|Role and visibility controls|3, 4, 11|IAM policy, policy-as-code, portal navigation, API guards|RBAC matrix tests +<br>TDS-003/004/005/020/021|
|Hospital demand and multiple funding<br>requests|6, 7, 8, 9, 10|Demand, FundingRequest, authorisation, adapter capability|AT suite + TDS-011/012/013/014|
|Lender application and financial events|6, 7, 9, 10|Lender adapter, webhook inbox, outbox, reconciliation|TDS-008/009/010/022/023|
|Disbursement and hospital receipt|6, 7, 8, 10, 12|Disbursement and HospitalReceipt records|TDS-015/016|
|Optional app and expense journal|4, 5, 6, 8, 11|Borrower client, separate expense service/schema and flags|TDS-018/019/024|
|Privacy, audit, retention and<br>compliance|11, 12, 13, 14|Consent ledger, audit pipeline, file lifecycle, security<br>evidence|Security/privacy release gate|
|Availability, performance and recovery|13, 14, 15|SLO dashboards, load tests, backups, DR runbooks|NFR verification and recovery tests|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 38 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

### **17.2 Required engineering handover pack** 

- Approved system context, component and deployment diagrams, trust boundaries and data-flow diagram. 

- OpenAPI specifications, webhook schemas, lender-specific adapter contracts, sandbox credentials procedure and partner certification evidence. 

- Logical ERD, physical schema/migrations, data dictionary, retention matrix and classification register. 

- Page inventory, approved screen flows, design system, responsive states, accessibility notes and client-side validation rules. 

- RBAC/ABAC policy matrix translated into executable tests and organisation/branch/case scope predicates. 

- State-transition tables and executable domain tests for Case, FRID, Demand, FundingRequest, Application, Sanction, Drawdown, Disbursement, Receipt and Consent. 

- CI/CD pipelines, infrastructure-as-code, secrets runbook, monitoring dashboards, SLO alerts, backup/restore and incident runbooks. 

- Functional, integration, contract, security, performance, UAT and regression test reports with traceability to requirement IDs. 

- NBFC, hospital, privacy/legal and internal approvals; unresolved decision log with owner and impact. 

### **17.3 Governance rules** 

- Business rule changes require Product Owner and Founder approval; changes affecting lender responsibility, data sharing, funds flow or regulatory perimeter require Compliance/Legal and NBFC review. 

- API/schema changes require versioning and compatibility review. Breaking partner changes require migration plan and partner notice. 

- Every production override must carry reason, actor, evidence, expiry (where applicable) and audit record; privileged/high-impact overrides require maker-checker. 

- No team may reinterpret UNKNOWN as failure or success without external confirmation; no team may use local status to override lender/hospital source of truth. 

- Keep one controlled source of truth for current requirements, approved ADRs, lender product versions and open decisions. Record owner, date, approval and superseded version. 

### **17.4 Approval and sign-off** 

|**Function**|**Approver / owner**|**Approval scope**|**Status**|
|---|---|---|---|
|Founder / Business Owner|Name / signature: __________________|<br>Business boundaries, operating model, exclusions and funding<br>product strategy.|Pending|
|Product Owner|Name / signature: __________________|<br>Screens, journeys, requirements, priorities and acceptance criteria.|Pending|
|Engineering / Architecture|Name / signature: __________________|<br>Architecture, data model, APIs, deployment and technical risks.|Pending|
|Security / Privacy|Name / signature: __________________|<br>Threat model, data handling, consent, access, retention and<br>assurance.|Pending|
|Operations|Name / signature: __________________|<br>Executive/hospital SOPs, exception queues, service levels and<br>runbooks.|Pending|
|NBFC partner|Authorised representative: _________|_<br>Lender product capability, API, fund flow, borrower terms, servicing<br>and escalation.|Pending|
|Hospital partner|Authorised representative: _________|_<br>Referral, demand evidence, portal access, beneficiary and receipt<br>procedures.|Pending|
|Legal / Compliance|Name / signature: __________________|<br>Regulatory perimeter, contracts, privacy and customer<br>communication.|Pending|



## **Appendix A. Glossary** 

|**Term**|**Meaning**|
|---|---|
|LSP|Lending Service Provider; agent of regulated lender carrying out agreed digital lending functions or parts thereof.|
|RE|Regulated Entity: bank, NBFC or other regulated lender within applicable RBI framework.|
|DLA|Digital Lending App/Platform; mobile and/or web user interface facilitating digital lending services, including LSP-operated<br>interfaces where covered.|
|Borrower|Person who applies for/owes the loan.|
|Patient|Person receiving treatment; may be different from borrower.|
|FRID|Financing Reference ID; unique identifier for borrower linking to executive-created financing case; not an authentication<br>credential.|
|CASE_ID|Internal unique ID for one hospitalisation/treatment financing service episode.|
|DEMAND_ID|Unique identifier for a distinct hospital payment demand.|
|Funding Request|Request to lender to finance a specific hospital demand or permitted utilisation; not itself approval.|
|APP_ID|Internal LSP application record identifier.|
|Lender Application<br>Reference|External ID assigned by lender.|
|KFS|Key Facts Statement; lender-provided disclosure including APR and key terms.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 39 

**HEALTHCARE FINANCING LSP  |  TECHNICAL DESIGN** 

|**Term**|**Meaning**|
|---|---|
|APR|Annual Percentage Rate as defined under applicable RBI instructions and lender disclosures.|
|Sanction|Lender approval with terms and conditions.|
|Facility|Approved credit limit/structure, if the lender product provides one.|
|Drawdown|Lender-approved utilisation under a facility.|
|Disbursement|Actual lender transfer to borrower or permitted end-beneficiary.|
|Hospital Receipt|Hospital confirmation of bank credit; distinct from lender transfer event.|
|ABAC|Attribute-Based Access Control; access restricted by context such as hospital, branch, assignment and relationship.|
|RBAC|Role-Based Access Control; permissions assigned to roles.|
|Idempotency|A repeated request/event does not create duplicate business/financial action.|
|Maker-checker|Two-person control where one person proposes and another independently approves.|
|System of record|Authoritative system for a specific data domain; hospital, lender and LSP each own different records.|
|Data fiduciary / processor|Roles under DPDP Act to be mapped for each processing activity by counsel.|
|Cooling-off period|Lender-defined minimum one-day period under applicable RBI digital lending framework during which borrower may exit on<br>prescribed terms.|
|Specific end-use<br>disbursement|Loan disbursal directly to end-beneficiary for a specific end use where RBI conditions and lender product permit.|



## **Appendix B. Technical terms used in this TDS** 

|**Term**|**Meaning in this design**|
|---|---|
|ABAC|Attribute-Based Access Control; authorisation using role plus attributes such as organisation, branch, assigned case, purpose<br>and field sensitivity.|
|ACID|Atomicity, Consistency, Isolation and Durability properties expected from core transactional DB writes.|
|API|Application Programming Interface; versioned contract used by portals, apps and approved partners.|
|DLQ|Dead-letter queue holding messages that cannot be processed after bounded retry.|
|FRID|Financing Reference ID; case reference, not a password or bearer credential.|
|Idempotency|Repeated execution of the same operation does not create a second business/financial effect.|
|KMS|Key Management Service used to protect encryption/signing keys.|
|Outbox / Inbox|Durable database patterns for publishing events and deduplicating received events.|
|RBAC|Role-Based Access Control; permissions grouped by workforce/customer roles.|
|RPO / RTO|Recovery Point Objective / Recovery Time Objective for data loss window and service restoration time.|
|SLO / SLA|Service Level Objective / Service Level Agreement.|
|WAF|Web Application Firewall at the internet-facing edge.|
|UUID / ULID|Opaque unique identifier formats; human-friendly references are separate from secure invitation tokens.|



## **Appendix C. Reference source and document control** 

Primary product baseline: Healthcare Financing LSP — Master Product & Operating Blueprint v0.2 (9 November 2026). This TDS is a derived technical working document. It inherits business boundaries and open-decision status from that baseline; it does not make unresolved decisions final. 

Source tables carried forward include role/RBAC, page inventories, state models, entity catalogue and relationships, integration and API concepts, event catalogue, NFRs, compliance controls, systems of record, reconciliation layers, risks, acceptance scenarios, ADRs, open decisions and glossary. 

Document owner: Founder / Product Owner. Review cadence: on every approved product boundary change, NBFC product/API change, material compliance change, production incident exposing a design gap, or architecture decision. Every published revision must include a change log and identify the baseline version it supersedes. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026  |  Page 40 

