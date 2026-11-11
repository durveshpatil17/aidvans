_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

# **HEALTHCARE FINANCING LENDING SERVICE PLATFORM** 

**MASTER PRODUCT REQUIREMENTS & OPERATING BLUEPRINT** 

A single working reference for the business model, product, operating model, workflows, roles, data, integrations, controls and acceptance. 

**Document ID** HF-LSP-MPB-002 **Version** 0.2 — Master specification **Date** 9 November 2026 **Status** Working baseline — founder review and lender/legal validation required **Product geography** India 

**Audience** Founder, product, engineering, operations, hospital partners, regulated lending partners, legal/compliance 

**DOCUMENT RULE** This blueprint distinguishes founder-confirmed boundaries from product recommendations and lender/legal dependencies. A proposed requirement is not a confirmed capability. Do not convert a dependency into a production promise without written lender approval and legal/compliance review. 

_Confidential working document. No company name, lender commitment, commercial term, sanction rate, SLA or credit policy is assumed unless explicitly approved and recorded._ 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  1 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

## **0. Document control and how to use this blueprint** 

|**Field**|**Value**|
|---|---|
|Document owner|Founder / Product Owner|
|Product name|Working name: Healthcare Financing LSP Platform|
|Version purpose|Consolidates business direction, product requirements and operating<br>requirements into a common build reference.|
|Supersedes|Business concept notes, SSOT v0.1 and PRD v0.1 for product-definition<br>purposes. Earlier documents remain historical inputs.|
|Status vocabulary|CONFIRMED = explicitly directed by founder; PROPOSED = recommended<br>design; DEPENDENT = requires NBFC, hospital, vendor or legal<br>confirmation; GATED = must not activate before formal approval; OUT OF<br>SCOPE = excluded from the defined business.|
|Change owner|Product Owner approves changes to business scope; Compliance/Legal<br>approves regulatory interpretation; Lender approves lender-specific product<br>behaviour; Engineering approves technical design.|



### **How decisions are represented** 

|**Tag**|**Meaning**|**Build treatment**|
|---|---|---|
|CONFIRMED|A firm business boundary or direction supplied by<br>founder.|Preserve unless founder explicitly changes it.|
|PROPOSED|A practical product/operating recommendation in<br>this blueprint.|Review and accept, amend or reject before<br>implementation.|
|DEPENDENT|Cannot be fixed until partner<br>product/API/operations are known.|Make configurable or adapter-based; do not hard-<br>code assumptions.|
|LEGAL-GATED|Requires written legal/compliance review and<br>partner approval.|Feature flag OFF until evidence is recorded.|
|OUT OF SCOPE|Explicitly excluded from the LSP service.|Do not build into normal workflow; do not collect<br>related data.|



### **Contents and navigation** 

1. Executive product definition and strategic boundaries 

2. Business model, value exchange and economics 

3. Operating model and service blueprint 

4. Users, organisations and access model 

5. Platform architecture and channel design 

6. Portal and screen inventory 

7. End-to-end business and user journeys 

8. Business rules and state machines 

9. Functional requirements and acceptance criteria 

10. Data model, entity mapping and dictionary 

11. Integration, APIs and event contracts 

12. Non-functional requirements 

13. Security, privacy and regulatory controls 

14. Operating procedures and controls 

15. Financial transaction, tranche and reconciliation model 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  2 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

16. Reporting, dashboards and product analytics 

17. Support, complaints and incident management 

18. Risk register and control catalogue 

19. Quality assurance and release acceptance 

20. Delivery governance and decision register 

21. Glossary and source register 

**IMPORTANT** The document is deliberately comprehensive. It is not a statement that every feature must ship together. Release sequencing is an engineering and commercial decision; this blueprint defines the target operating system and the rules that must not be violated. 

## **1. Executive product definition and strategic boundaries** 

_This section is the controlling statement of what the business is and is not._ 

### **1.1 Product definition** 

The company operates as a technology-enabled Lending Service Provider (LSP) working under contractual arrangements with regulated lenders such as banks and NBFCs. It provides a hospital-based, digitally assisted process for initiating and coordinating patient-specific medical financing applications. The primary physical interface is an LSP executive desk at or near a participating hospital. Customers may continue through a secure mobile-web experience or optional native mobile application. 

The LSP creates and manages a financing case, captures the hospital funding requirement, facilitates borrower onboarding and lender application submission, communicates application progress, and tracks lender-confirmed disbursement information. The regulated lender independently performs credit assessment, makes the lending decision, issues loan disclosures and agreements, maintains the authoritative loan account, and disburses directly to the hospital where the lender confirms that the specific end-use structure is permitted. 

**CORE PROMISE** Reduce repeated data entry, unnecessary handoffs and avoidable waiting in the hospital financing process. Do not promise loan approval, a specific interest rate, same-day funds or insurer reimbursement. 

### **1.2 Confirmed product boundaries** 

|**Boundary**|**Decision**|**Implication**|
|---|---|---|
|Business role|CONFIRMED — LSP only.|No lending from company balance sheet; no<br>independent credit approval; no guarantee of<br>lender decision.|
|Hospital software|CONFIRMED — no HMS/ERP/billing integration at<br>this stage.|Operate independently using executive-assisted<br>entry, secure borrower links and authorised<br>hospital portal functions.|
|Physical channel|CONFIRMED — executive desk is a primary<br>channel.|Executive creates the case and initiates the<br>assisted journey.|
|QR/mobile web|CONFIRMED — provide a no-install digital<br>continuation path.|QR/deep link must identify the correct case<br>safely.|
|Native application|CONFIRMED AS AN OPEN PRODUCT CHANNEL<br>— optional app may be installed and used for<br>case tracking and approved ancillary features.|App install must not be mandatory for loan<br>application completion.|
|Case creation gate|CONFIRMED — executive must first<br>create/initiate the financing case and generate its<br>unique ID.|An unlinked app user cannot originate a loan<br>application through the LSP platform.|
|Borrower action|CONFIRMED — the borrower personally<br>completes required declarations, consents,<br>authentication and loan acceptance.|Executive must not impersonate borrower or<br>collect/enter secret authentication credentials.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  3 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Boundary**|**Decision**|**Implication**|
|---|---|---|
|Family contribution|CONFIRMED — personal and outside LSP<br>workflow.|No family contribution collection, allocation,<br>tracking, split accounting or reimbursement<br>coordination.|
|Hospital demands|CONFIRMED — may occur at multiple points in an<br>episode.|Model multiple demands and funding requests<br>under a case; do not assume one final bill or one<br>payment event.|
|Tranche mechanics|DEPENDENT — multiple drawdowns depend on<br>actual lender product.|Model demand separately from loan drawdown<br>and disbursement.|
|Funds flow|CONFIRMED — LSP must not hold/control loan<br>funds.|Lender-to-hospital disbursement only where<br>legally and contractually permitted.|
|Expense tracking|PROPOSED/LEGAL-GATED — optional patient<br>personal expense journal.|Keep separate from lender ledger, hospital ledger<br>and family contributions; storage model needs<br>approval.|



### **1.3 Product goals** 

- Enable a hospital executive to create a complete, traceable financing case quickly without opening or modifying the hospital’s existing software. 

- Let the borrower securely link to the executive-created case and complete their own application with minimal repetition. 

- Give the borrower clear visibility into the application, lender documents, status and lender-confirmed transactions. 

- Support multiple hospital payment demands under one hospitalisation case, while leaving loan mechanics to the lender product. 

- Give hospital users restricted visibility into relevant case and disbursement status without exposing borrower-sensitive information. 

- Provide administrators and operations teams with control, auditability, exception handling and reliable reporting. 

- Keep the platform modular so additional lenders and channels can be added without changing the core case model. 

### **1.4 Non-goals / explicit exclusions** 

- The company is not a bank, NBFC, insurer, TPA, hospital, payment aggregator or medical provider merely by operating this LSP platform. Legal classification must be verified for the final activities and contracts. 

- No independent underwriting, credit score, sanction, pricing, loan modification or recovery decision by the LSP. 

- No holding, pooling, routing, netting or controlling borrower, lender or hospital funds. 

- No family member contribution workflow, family wallet, family split or reimbursement to relatives. 

- No insurance claim filing, adjudication, guarantee or representation that a claim will be paid. 

- No hospital clinical record, diagnosis, treatment recommendation or medical decision system. 

- No HMS/ERP, billing, HIS or EHR integration in the current scope. 

- No mandatory native app installation. 

- No arbitrary credit-line utilisation or drawdown without lender support and borrower-authorised controls. 

- No storing full KYC/medical documents indefinitely in an LSP-controlled vault without explicit regulatory, lender and legal clearance. 

## **2. Business model, value exchange and economics** 

### **2.1 Participants and value exchange** 

|**Participant**|**Provides**|**Receives**|**Boundary**|
|---|---|---|---|
|Borrower / applicant|Personal information, application<br>data, consent, declarations, lender-<br>required authentication and<br>repayment obligation.|Financing application support,<br>transparent lender options where<br>applicable, status visibility and<br>access to lender documents.|Borrower is the loan customer;<br>lender terms govern.|
|Patient|Hospitalisation / treatment context<br>and hospital payment need; may or<br>may not be borrower.|Potential benefit from hospital<br>payment.|Patient and borrower are separate<br>roles; do not assume same person.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  4 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Participant**|**Provides**|**Receives**|**Boundary**|
|---|---|---|---|
|Hospital / branch|Verified hospital identity, payment<br>demand/estimate/invoice,<br>beneficiary bank evidence,<br>authorised staff and receipt<br>confirmation.|Potentially faster and more<br>predictable collection.|Hospital does not approve loans or<br>see full borrower credit profile.|
|LSP executive|Case initiation, assisted onboarding,<br>demand capture, borrower guidance<br>and coordination.|Operational workflow and case<br>tools.|No credit decisions, no<br>OTP/password handling, no cash<br>collection.|
|LSP company|Technology, workflow orchestration,<br>operational controls, support and<br>reporting.|Contracted service fees paid by<br>regulated lender, subject to<br>agreement and law.|No separate borrower LSP fee.|
|Regulated lender|Product, underwriting, KYC/AML as<br>applicable, sanction, KFS,<br>agreement, disbursement, loan<br>account, repayment and complaint<br>accountability.|Loan interest/fees under its own<br>terms and risk policy.|Lender remains accountable for<br>outsourced activity.|



### **2.2 Potential revenue model** 

The intended revenue path is lender-paid LSP compensation defined in a written NBFC/bank agreement. Possible contractual bases include per eligible application, per disbursed loan, service fee, implementation fee paid by partner or other permitted commercial structures. No rate, incentive or fee base is assumed in this specification. 

**REGULATORY CONTROL** RBI’s NBFC digital lending framework states that fees/charges/reimbursements payable to the LSP are paid directly by the NBFC and are not charged to or collected separately from the borrower by the LSP. Commercial design must preserve this boundary. [R1] 

### **2.3 Unit economics model — variables, not assumed values** 

|**Metric**|**Definition / formula**|**Data required**|
|---|---|---|
|Eligible referred cases|Count of unique, valid financing cases created.|Case creation and duplicate flags.|
|Application start rate|Applications started ÷ eligible cases.|Application events.|
|Completion rate|Applications submitted ÷ applications started.|Application events and abandonment reason.|
|Sanction rate|Sanctioned applications ÷ applications decided.|Lender decision outcomes.|
|Disbursement conversion|Cases with confirmed disbursement ÷ eligible<br>cases.|Lender transaction confirmation.|
|Average disbursed ticket|Total confirmed principal disbursed ÷<br>disbursement count.|Lender disbursement feed.|
|Net LSP revenue per disbursement|Recognised lender-paid LSP revenue ÷ confirmed<br>disbursements.|Contract terms and finance ledger.|
|Hospital acquisition cost|Hospital onboarding cost ÷ activated hospitals.|Sales/implementation cost.|
|Cost per funded case|Total attributable operating/acquisition cost ÷<br>funded cases.|Staff time, channel, vendor and support cost.|
|Executive productivity|Completed valid cases or funded cases per<br>executive per period.|Assignment and activity log.|
|Time to hospital credit|Time from complete lender submission or<br>sanction to confirmed hospital credit, separately<br>measured.|Lender timestamps and bank/hospital<br>confirmation.|
|Complaint rate|Complaints ÷ cases or borrowers, with<br>denominator declared.|Complaint records.|
|Fraud / invalid case rate|Confirmed fraud or invalid cases ÷ total cases.|Investigation outcomes.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  5 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

### **2.4 Commercial questions not to hard-code** 

- Is the partner arrangement exclusive or non-exclusive? 

- Are fees earned on application, sanction, disbursement, servicing or another permitted event? 

- How are reversals, refunds, cancellations, cooling-off exits and failed disbursements treated commercially? 

- Who bears customer support cost and integration cost? 

- Who owns hospital relationship and who contracts with hospital? 

- Is the hospital portal offered at no cost, as a paid service, or as part of the LSP distribution agreement? 

- Can one hospital be served by multiple lenders and multiple LSP agreements? 

- Can LSP receive incentives linked to lender choice? Any such design needs fairness/conflict review and objective disclosure. 

## **3. Operating model and service blueprint** 

### **3.1 Independent operating model** 

The LSP operates outside the hospital’s core information systems. The hospital and LSP agree a manual/digital operating protocol: how staff refer patients, what evidence establishes a payment demand, how hospital beneficiary details are verified, who confirms receipt, and how escalation works. The hospital’s existing billing system remains the hospital’s system of record. The lender’s system remains the loan system of record. 



<!-- Start of picture text -->
Independent LSP operating model (no HMS integration)<br>Access channels<br>C<br>anna a a Seas es<br>‘Case + FRID + demand’ application orchestration<br>‘status * ul» notations<br>/API/ secure file / portal / manual fallback\<br>Regulated lender<br>teitng* RYE» sanction» KFS customer actions / notices<br>Fan /NBFC<br>_ faciny *cranidown* disbursement * loan account<br>/direct disbursement where permitted \KFS * agreement * repayment * statements/<br>{(Hospitalvented enatbeneticiaybank account —| consent appcatonBorrower / patent“tender agreement a|<br><!-- End of picture text -->

### **3.2 Service blueprint: frontstage, backstage and system** 

|**Stage**|**Borrower / patient**|**Executive / LSP**|**Hospital**|**Lender**|**System evidence**|
|---|---|---|---|---|---|
|Referral|Asks how to finance<br>hospital payment.|Explains LSP role, no<br>approval guarantee<br>and consent<br>boundaries.|Directs customer to<br>desk / QR.|—|Referral source and<br>staff / desk identity.|
|Case initiation|Provides minimum<br>identity/contact to<br>locate case; borrower<br>identified.|Creates case; assigns<br>patient, borrower,<br>hospital and branch;<br>creates FRID.|Confirms hospital<br>location and payment<br>demand evidence.|—|Case ID, FRID, creator,<br>timestamp, hospital<br>scope.|
|Application|Completes personal<br>data and consent.|Guides without<br>entering secrets or<br>making declarations.|—|Receives application<br>and performs lender<br>checks.|Consent, application<br>version, lender<br>reference.|
|Decision|Reviews lender offer<br>and KFS; accepts or<br>declines.|Explains process<br>neutrally; cannot<br>recommend through<br>hidden incentives.|—|Makes and<br>communicates<br>decision.|Decision event, offer<br>and KFS references.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  6 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Stage**|**Borrower / patient**|**Executive / LSP**|**Hospital**|**Lender**|**System evidence**|
|---|---|---|---|---|---|
|Demand / drawdown|Reviews and<br>authorises each<br>additional funding<br>request if required by<br>lender product.|Captures demand<br>evidence and initiates<br>request.|Confirms current<br>demand and<br>beneficiary.|Checks facility<br>availability and terms;<br>approves / rejects.|Demand ID, borrower<br>authorisation, lender<br>drawdown ID.|
|Payment|Receives update.|Tracks lender<br>confirmation;<br>escalates mismatch.|Confirms credited<br>receipt where process<br>requires.|Disburses to hospital<br>account and reports<br>result.|Bank/lender reference,<br>amount, value date,<br>receipt confirmation.|
|Closure|Views case summary<br>and lender loan<br>account information.|Closes LSP service<br>case when obligations<br>complete; keeps loan<br>status distinct.|Provides final hospital<br>reconciliation to<br>patient directly.|Maintains loan balance<br>and repayment status.|Case close reason;<br>loan remains open until<br>lender closes.|



### **3.3 Responsibility matrix (RACI)** 

|**Activity**|**Borrower**|**Executive / LSP**|**Hospital**|**Lender**|**LSP Admin / Ops**|
|---|---|---|---|---|---|
|Create LSP case|C|R|C|I|A|
|Verify hospital<br>beneficiary|I|C|R|A|C|
|Borrower consent and<br>declarations|R|I|I|A|C|
|KYC / credit<br>assessment|R|C|I|A/R|I|
|Loan decision and<br>pricing|I|I|I|A/R|I|
|Capture hospital<br>demand|C|R|A/R|I|C|
|Borrower drawdown<br>authorisation|A/R|I|I|C|I|
|Drawdown eligibility /<br>disbursement|I|I|C|A/R|I|
|Confirm hospital<br>receipt|I|C|A/R|C|I|
|LSP case support /<br>complaint intake|R|R|C|A|A/R|
|Platform access and<br>controls|I|I|I|C|A/R|



_R = Responsible; A = Accountable; C = Consulted; I = Informed. This matrix is a proposed baseline and must be reconciled with each NBFC outsourcing agreement, hospital contract and applicable law._ 

### **3.4 Hospital operating protocol required before activation** 

- Identify an authorised hospital sponsor and named finance/billing contact for each branch. 

- Validate hospital legal name, branch address, bank account, account holder, IFSC, proof of bank account and authorised verifier using independent controls. 

- Define accepted evidence: hospital estimate, advance demand slip, interim bill, final invoice, digitally verifiable demand or authorised signed/stamped document. 

- Define referral method: executive desk, QR, hospital staff referral or hospital portal (portal is optional; no HMS integration). 

- Define how demands are confirmed and how changes/cancellations are communicated. 

- Define how hospital receives payment status without receiving borrower credit/KYC information. 

- Define receipt confirmation method and time expectation. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  7 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

- Define beneficiary change controls: no change based solely on a borrower/executive chat or email; independent callback and dual approval. 

- Train hospital staff not to promise approval, rate, disbursement time or insurance reimbursement. 

- Define escalation, grievance contact, fraud hold and temporary suspension mechanism. 

## **4. Users, organisations and access model** 

### **4.1 Core actor definitions** 

|**Actor / entity**|**Definition**|**Can be same as**|
|---|---|---|
|Patient|Person receiving hospital treatment.|Borrower, but not assumed.|
|Borrower|Person legally applying for and owing the loan.|Patient or family member / other eligible<br>applicant.|
|Co-applicant / guarantor|Additional party only if lender product requires<br>and legal terms support it.|May be a relative; not a family-contribution<br>tracker.|
|Executive|Authorised LSP employee who initiates and<br>coordinates a case.|Cannot be borrower’s agent for consent/secret<br>authentication.|
|Hospital staff|Hospital employee who refers a customer or<br>verifies a hospital demand.|Hospital admin/finance/referral staff; roles<br>separate.|
|Lender user/system|NBFC/bank staff or API integration that<br>communicates lender status.|Not an LSP admin.|
|Platform operator|LSP staff managing users, hospitals, cases,<br>settings and controls.|Admin, operations, support, compliance roles.|



### **4.2 Role catalogue** 

|**Role ID**|**Role**|**Purpose**|**Default scope**|
|---|---|---|---|
|SUPER_ADMIN|Super Administrator|Platform-wide emergency<br>administration, tenant/config<br>governance.|All tenants only with privileged,<br>audited access.|
|PLATFORM_ADMIN|Platform Administrator|Manage platform entities, users,<br>products, lender connections,<br>configurations.|Assigned organisation / all-platform<br>per grant.|
|OPS_MANAGER|Operations Manager|Allocate cases, resolve exceptions,<br>manage queues and executive<br>productivity.|Assigned geography / hospital<br>portfolio.|
|EXECUTIVE|Financing Executive|Create cases, capture demands,<br>coordinate borrowers and track<br>progress.|Assigned hospitals/branches and<br>own/assigned cases.|
|HOSPITAL_ADMIN|Hospital Administrator|Manage hospital staff and permitted<br>branch-level access.|Own hospital organisation and<br>permitted branches.|
|HOSPITAL_FINANCE|Hospital Finance User|Submit/verify payment demand and<br>view relevant disbursement/receipt<br>status.|Own hospital/branch and<br>authorised case set.|
|HOSPITAL_REFERRAL|Hospital Referral User|Refer customer and see limited case<br>status.|Own hospital/branch; least<br>privilege.|
|SUPPORT_AGENT|Customer Support|Handle enquiries and tickets using<br>masked data.|Assigned tickets; temporary case<br>access if approved.|
|COMPLIANCE_AUDITOR|Compliance / Audit|Review consent, disclosures,<br>access logs, partner performance<br>and exceptions.|Read-only, scoped; privileged export<br>controlled.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  8 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Role ID**|**Role**|**Purpose**|**Default scope**|
|---|---|---|---|
|BORROWER|Borrower account|Link FRID and access own<br>application / lender data made<br>available.|Only verified linked cases and own<br>profile.|
|||Optional restricted view when|Only patient-facing hospital case|
|PATIENT_VIEWER|Patient viewer|patient is not borrower and<br>lender/legal arrangement permits.|summary; not loan account unless<br>borrower.|



### **4.3 RBAC permission matrix** 

Legend: F = full within scope; C = create; R = read; U = update; A = approve/authorise within platform (never credit approval); X = no access; M = masked/limited. All permissions are further restricted by organisation, branch, assignment, case relationship and data classification. 

|**Resource /**<br>**action**|**Super**<br>**Admin**|**Platform**<br>**Admin**|**Ops Mgr**|**Executive**|**Hospital**<br>**Admin**|**Hospital**<br>**Finance**|**Hospital**<br>**Referral**|**Support**|**Auditor**|**Borrower**|
|---|---|---|---|---|---|---|---|---|---|---|
|Manage<br>platform<br>roles /<br>policy|F|C/U|X|X|X|X|X|X|R|X|
|Manage<br>lender<br>config /<br>connectors|F|C/U|R|X|X|X|X|X|R|X|
|Manage<br>hospital<br>org /<br>branches|F|C/U|R|X|U own|R own|R own|X|R|X|
|Create<br>financing<br>case|F|C|C|C|C limited*|C referral*|C referral*|X|R|X|
|View case<br>details|F|F|F scoped|F assigned|M own|M own|M referral|M ticket|R scoped|R linked|
|View<br>borrower<br>KYC /<br>income|F audited|M/need|M/need|M/need|X|X|X|M<br>temporary|R audited|R own|
|Edit<br>demand<br>record|F|U|U scoped|C/U before<br>submit|C/U own|C/U own|C limited*|X|R|X|
|Authorise<br>loan<br>drawdown|X|X|X|X|X|X|X|X|R audit|R via lender<br>flow|
|Lender<br>credit<br>decision|X|X|X|X|X|X|X|X|R audit|R own<br>decision|
|See lender<br>offer/KFS|R audited|M|M|M process<br>only|X|X|X|M|R|R own|
|View<br>disbursem<br>ent status|F|F|F scoped|F assigned|R own|R own|M|M ticket|R|R own|
|Export<br>reports|F|F scoped|C scoped|X|C own<br>summary|X|X|X|C audit|X|
|View<br>personal<br>expense<br>journal|X|X|X|X|X|X|X|X|X|R own only|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  9 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Resource /**<br>**action**|**Super**<br>**Admin**|**Platform**<br>**Admin**|**Ops Mgr**|**Executive**|**Hospital**<br>**Admin**|**Hospital**<br>**Finance**|**Hospital**<br>**Referral**|**Support**|**Auditor**|**Borrower**|
|---|---|---|---|---|---|---|---|---|---|---|
|Handle<br>complaint|F|C/U|C/U|C/U|C own|C own|C own|C/U|R audit|C own|
|View audit<br>logs|F|R scoped|R ops|R own<br>actions|R own org<br>actions|X|X|M ticket|R|R own<br>activity<br>summary|



_* Hospital staff case creation/referral is PROPOSED and feature-flagged. It does not replace the confirmed executive-created FRID gate unless founder changes the policy. If enabled, staff referral creates a referral record or draft request only; an authorised LSP executive must validate and activate the financing case/FRID._ 

### **4.4 Attribute-based access controls (ABAC)** 

- tenant_id / organisation_id: user can access only their organisation unless explicitly granted cross-tenant role. 

- hospital_id and branch_id: hospital users are restricted to their own legal entity and assigned branches. 

- case_id and assignment_id: executives and ops users can access only cases assigned to them or their authorised queue. 

- borrower_id / verified account link: borrower can access only cases linked after verification. 

- data_classification: public, internal, confidential, restricted KYC/financial, restricted health-related. 

- purpose and ticket context: support and compliance access must be purpose-limited and recorded. 

- time-bound elevation: temporary privileged access requires reason, approver, expiry and immutable audit. 

- field-level masking: hide income, PAN/Aadhaar identifiers, bank details, credit bureau data, full documents and unrelated personal data from hospital users. 

### **4.5 Authentication and account rules** 

- Separate workforce authentication from borrower authentication. Workforce accounts must use individual IDs; no shared desk logins. 

- MFA for platform admin, operations manager, executive, support, compliance and hospital admin roles. 

- Borrower authentication uses verified mobile/email or lender-approved method; app PIN/biometric may unlock local app session but cannot replace lender-required transaction authentication. 

- FRID is an identifier/linking reference, not a password, bearer token or proof of identity. Linking requires independent possession/verification and must resist guessing. 

- Privileged accounts require strong MFA, device/session controls and periodic access review. 

- Session expiry, logout, device change, SIM change and lost-phone flows must be defined. 

- Role deactivation must revoke active sessions and access tokens promptly. 

## **5. Platform architecture and channel design** 

### **5.1 Logical architecture** 

The platform is organised around a shared case-management and lending-orchestration core, with separate role-specific interfaces. The channels must not maintain independent copies of case business logic. All channels use the same identity, access policy, case lifecycle, event audit and integration services. 

|**Layer**|**Components**|**System of record / responsibility**|
|---|---|---|
|Experience|Admin web, operations web, executive web,<br>hospital web, borrower mobile web, optional<br>Android/iOS app, public website.|Presentation only; must not be trusted as the<br>access-control boundary.|
|Identity and access|Workforce identity, borrower identity/link, MFA,<br>sessions, RBAC, ABAC, consent identity.|LSP controls user access; lender controls lender<br>authentication/KYC steps.|
|Core domain|Organisation, hospital branch, user, patient,<br>borrower, financing case, FRID, demand, funding<br>request, assignment, case timeline.|LSP system of record for its own service workflow.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  10 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Layer**|**Components**|**System of record / responsibility**|
|---|---|---|
|Lending orchestration|Lender/product directory, eligibility routing<br>metadata, application submission, offers,<br>sanction references, drawdown requests,<br>disbursement events.|LSP stores permitted process references; lender<br>remains source of truth for credit and loan<br>account.|
|Integration|Lender API adapters, secure file/manual fallback,<br>webhook receiver, notification provider, KYC<br>redirection/provider if lender-authorised.|External systems remain authoritative for their<br>own outputs.|
|Data and controls|Operational database, audit log, consent ledger,<br>document metadata/reference store,<br>queue/event store, analytics warehouse.|Data minimisation; storage/retention governed by<br>lender agreements and applicable law.|
|Operations|Task queues, exception management, support<br>tickets, reconciliation console, monitoring,<br>incident management.|LSP operational control and evidence.|



### **5.2 Channel strategy** 

|**Channel**|**User**|**Role in journey**|**Key rule**|
|---|---|---|---|
|Executive portal|LSP executive|Primary assisted channel: create<br>case, generate FRID, capture<br>hospital demand, coordinate.|Executive initiates the case;<br>borrower performs borrower-only<br>actions.|
|QR / mobile web|Borrower|No-install application continuation<br>and status.|QR deep-links to a specific case;<br>FRID linking is verified and single-<br>purpose.|
|Native app|Borrower|Optional persistent companion for<br>linked cases, notifications, lender<br>status, and approved personal<br>expense tracker.|No standalone loan originations; no<br>case without executive-generated<br>FRID.|
|Hospital portal|Hospital staff|Restricted referral/demand/status<br>collaboration.|No access to sensitive credit/KYC or<br>family data; no loan approval.|
|Admin / operations portal|LSP staff|Configuration, governance,<br>exception resolution, support,<br>reporting.|Privileged access is limited, logged<br>and reviewed.|
|Public website|Prospective borrower/partner|Explain product, LSP role, partner<br>lenders, complaint route and privacy<br>notices.|No misleading approval/rate claims;<br>publish required partner/LSP<br>disclosures.|



### **5.3 FRID and invitation-link security** 

- FRID must be unique, non-sequential or otherwise unguessable, and not disclose patient identity, hospital, branch or loan amount. 

- FRID is not a bearer credential. App linking requires an invitation token with expiry plus verification to a contact method recorded by the executive and validated by borrower. 

- Invitation link must be one-time or safely re-issuable; revocation invalidates previous tokens. 

- The case and borrower relationship must be checked before app access is granted. 

- A single borrower account may be linked to multiple cases over time; one case may have one borrower plus lender-required co-applicants/guarantors. 

- If patient differs from borrower, the interface clearly shows both roles and what each person can see. 

- Support staff cannot manually link a borrower to a case without a verified workflow and recorded reason. 

- FRID may be shared by a family member, but possession alone cannot expose case information. 

### **5.4 No-HMS-integration policy** 

**CONFIRMED** No integration with hospital HMS, HIS, ERP, EHR or billing software in this operating scope. Hospital records and LSP records remain separate. No iFrame dependency is required. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  11 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

A later integration may be proposed as a separately approved change. It requires a business case, hospital security review, datasharing agreement, integration architecture, source-of-truth mapping, interface ownership, incident process and versioned API contract. It must not be introduced implicitly. 

### **5.5 Recommended technology characteristics (vendor-neutral)** 

- API-first backend with modular domain boundaries; avoid tightly coupling the mobile app, web portal and lender connector. 

- Relational transactional database for cases and financial process references; immutable audit/event record for critical actions. 

- Object/document storage only for documents the LSP is permitted to process/store; use metadata and lender-hosted document links where possible. 

- Queue/event processing for asynchronous lender callbacks and notifications; all handlers idempotent. 

- Adapter per lender so each lender’s API, status model, product and drawdown capability are configured independently. 

- Feature flags for lender products, hospital portal actions, native app capabilities and legally gated expense features. 

- Manual fallback for lender portal/file workflows must create the same case/event records as API integrations. 

## **6. Portal and screen inventory** 

_This is a minimum complete inventory of screens/pages and primary behaviour. Each screen becomes a UI specification with field-level validation, API mapping, permission policy and error states._ 

### **6.1 Global/public and access pages** 

|**Screen ID**|**Page / screen**|**Primary users**|**Purpose and key elements**|
|---|---|---|---|
|PUB-01|Public home / product overview|Public|Explain medical financing<br>facilitation, assisted desk, mobile<br>web/app, LSP role and limitations.|
|PUB-02|How it works|Public|Explain case creation, borrower<br>application, lender decision, direct<br>hospital disbursement where<br>permitted.|
|PUB-03|Partner hospitals / locations|Public|Show participating hospital/branch<br>only with active agreement and<br>current details.|
|PUB-04|Lender partners and disclosures|Public|Display lender names, links,<br>products, LSP activity, customer<br>care and partner-required<br>disclosures.|
|PUB-05|Fees and charges explanation|Public|Explain lender charges are lender-<br>defined; LSP does not separately<br>charge borrower for LSP service.|
|PUB-06|Privacy notice|Public|Purposes, data types, parties,<br>retention, contact, consent<br>withdrawal and grievance path.|
|PUB-07|Complaint / support contact|Public|Complaint intake and lender/LSP<br>grievance escalation details.|
|AUTH-01|Workforce login|Employees|User ID/password or SSO, MFA,<br>account lock and device/session<br>context.|
|AUTH-02|Borrower OTP / sign-in|Borrower|Verified phone/email login with anti-<br>enumeration and rate limits.|
|AUTH-03|FRID linking|Borrower|Enter/open FRID; verify secure<br>invitation token and borrower<br>identity before showing details.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  12 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Screen ID**|**Page / screen**|**Primary users**|**Purpose and key elements**|
|---|---|---|---|
|AUTH-04|Forgot / recover account|All|Secure recovery; no account<br>disclosure to unauthenticated<br>requester.|
|AUTH-05|MFA setup / device management|Workforce / borrower|Register authenticators, review<br>active sessions, revoke device.|
|AUTH-06|Consent and notice centre|Borrower|Review separate purpose-specific<br>notices, choices and withdrawal<br>actions.|



### **6.2 Admin portal pages** 

|**Screen ID**<br>ADM-01|**Page**<br>Admin dashboard|**Core elements / actions**<br>Cases today, pending queues,<br>lender status, exceptions, hospital<br>coverage, executive workload,<br>complaints, alerts.|**Controls**<br>Role and geography filters; data<br>timestamp; no hidden credit score<br>analytics.|
|---|---|---|---|
|ADM-02|User directory|Create/invite/deactivate staff,<br>assign organisation, branch, role,<br>supervisor.|No shared accounts; dual approval<br>for privileged role.|
|ADM-03|Role and permission management|Role templates, permission matrix,<br>ABAC attributes, field masking.|Versioned policy; least privilege;<br>break-glass audit.|
|ADM-04|Organisation management|LSP legal entities, hospital<br>organisations, branches, lender<br>entities, status.|Verification evidence and effective<br>dates.|
|ADM-05|Hospital/branch management|Hospital profile, address, authorised<br>staff, verified beneficiary account<br>metadata, contacts, agreement<br>status.|Beneficiary changes maker-checker<br>and independent callback.|
|ADM-06|Lender directory|NBFC details, regulated status<br>evidence, partner agreement,<br>contacts, grievance link, connector<br>status.|Compliance approval and expiry<br>alerts.|
|ADM-07|Lender product configuration|Ticket limits, tenure, supported<br>drawdown modes, required fields,<br>KFS links, cooling-off config, SLA<br>parameters.|Source from signed lender product<br>sheet; version and effective date.|
|ADM-08|Lender connector management|API credentials reference, webhook<br>keys, certificate expiry, mapping and<br>health.|Secrets in vault; not readable by<br>ordinary admins.|
|ADM-09|Case search and audit view|Search case/FRID/app IDs; timeline,<br>assignment, status, exceptions.|Restricted data; search logged.|
|ADM-10|Exception management|Retry, assign, resolve, escalate,<br>mark duplicate/fraud hold, record<br>evidence.|No manual alteration of lender<br>decision or payment state without<br>source evidence.|
|ADM-11|Business configuration|ID formats, notifications, allowed<br>file types, reason codes, escalation<br>thresholds.|Versioned, test-before-publish; no<br>hidden pricing/credit changes.|
|ADM-12|Reports and exports|Operational, conversion, partner,<br>SLA, complaints and audit reports.|Export approval, watermark,<br>minimisation and access logging.|
|ADM-13|Audit and access logs|Login, data view, download,<br>permission changes, status<br>overrides, API calls.|Append-only or tamper-evident<br>retention.|
|ADM-14|Content and disclosure manager|Privacy pages, lender disclosure<br>links, terms versions, FAQs, contact<br>details.|Legal approval and publication<br>history.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  13 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Screen ID**|**Page**|**Core elements / actions**|**Controls**|
|---|---|---|---|
|ADM-15|Support and complaint console|Ticket queue, ownership, SLA,<br>escalation, response and closure.|Sensitive data masked by default.|
|ADM-16|System health / integration console|Webhook errors, queue depth,<br>lender adapter uptime, notification<br>failures.|No secret values in logs.|



### **6.3 Operations manager pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Controls**|
|---|---|---|---|
|OPS-01|Operations dashboard|Workload, ageing, pending customer<br>actions, lender queues, payment<br>exceptions and cases requiring<br>human attention.|Queue scope based on<br>role/territory.|
|OPS-02|Case allocation board|Assign/reassign executive, priority,<br>hospital, branch and shift.|Reason required; prior assignment<br>history preserved.|
|OPS-03|Case workspace|Full LSP timeline, contacts, demand<br>status, application refs, lender<br>events and actions.|Sensitive borrower data field-<br>masked.|
|OPS-04|Exception workbench|Duplicate, mismatch, timeout,<br>callback gap, failed disbursement,<br>hospital bank issue.|Resolution code and evidence<br>mandatory.|
|OPS-05|Hospital service quality|Hospital referral volume, demand<br>turnaround, receipt confirmation<br>and complaints.|No clinical performance or patient<br>treatment inference.|
|OPS-06|Executive performance|Assigned cases, completion, ageing,<br>QA findings and training needs.|No incentive solely on loan approval<br>without compliance review.|
|OPS-07|Daily reconciliation|Lender reported transactions vs LSP<br>records and hospital receipt<br>confirmations.|Maker-checker for manual<br>adjustments.|
|OPS-08|Escalation queue|Cases approaching SLA or requiring<br>lender/hospital senior attention.|Clock pauses/causes recorded<br>explicitly.|
|OPS-09|Operational report exports|Date/branch/lender/owner filters<br>and exception summaries.|Purpose and approval recorded.|



### **6.4 Executive portal pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Controls**|
|---|---|---|---|
|EXE-01|Executive home/dashboard|Assigned cases, new referrals,<br>pending borrowers, lender<br>decisions, payment demands,<br>disbursement follow-up.|Only assigned/authorised cases.|
|EXE-02|New financing case wizard|Select hospital/branch; identify<br>patient and borrower separately;<br>collect minimum case data; check<br>duplicates.|Case creation permissions; data<br>validation.|
|EXE-03|Patient and borrower details|Patient name/contact/admission<br>reference; borrower<br>identity/contact; relationship;<br>patient≠borrower flag.|Do not collect lender KYC beyond<br>permitted scope; separate notices.|
|EXE-04|Hospital funding need|Demand type, amount, due time,<br>reason category, estimate/advance<br>slip reference and evidence.|Hospital confirmation or evidence<br>policy.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  14 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Screen ID**|**Page**|**Core elements / actions**|**Controls**|
|---|---|---|---|
|EXE-05|Case review and FRID generation|Review minimum fields, confirm<br>hospital scope, create unique FRID,<br>create invitation.|Only executive-initiated cases<br>generate active FRID.|
|EXE-06|Borrower invitation|QR, SMS/email deep link,<br>resend/revoke, expiry, delivery<br>status.|Secure one-time token; contact<br>verification.|
|EXE-07|Application progress|Lender status, pending borrower<br>action, pending lender action,<br>rejection reason category if lender<br>provides.|No promise or editing lender<br>decision.|
|EXE-08|Lender offer / selection assistance|See eligible lender offers, required<br>disclosures and KFS links.|Objective display; no hidden<br>ranking; borrower chooses.|
|EXE-09|Demand and funding request|Create later demand; attach<br>evidence; request amount; check<br>facility/drawdown eligibility.|Do not present demand as approved<br>loan drawdown.|
|EXE-10|Disbursement tracker|Lender transaction status,<br>beneficiary, amount, reference,<br>value date and hospital receipt.|Status sourced; no manual mark as<br>paid without evidence.|
|EXE-11|Case timeline|Immutable chronological events and<br>notes.|Sensitive notes restricted;<br>corrections via superseding event.|
|EXE-12|Customer communication|Approved templates, language,<br>delivery status and call outcome.|No misleading financial advice; opt-<br>out preferences.|
|EXE-13|Case closure|Close LSP case service work with<br>reason and unresolved item check.|Does not close lender loan or<br>hospital bill.|
|EXE-14|Executive profile and tasks|Shift, assigned branch, training,<br>checklist and account security.|Individual login; no sharing.|



### **6.5 Hospital portal pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Visibility constraints**|
|---|---|---|---|
|HOS-01|Hospital login|Hospital organisation and branch<br>membership, MFA, account status.|No global platform access.|
|HOS-02|Hospital dashboard|Own branch case counts, referrals,<br>demands awaiting confirmation,<br>lender status and receipt<br>confirmations.|No borrower-wide personal finance<br>details.|
|HOS-03|Referral entry (optional)|Create referral/draft with patient<br>contact and branch.|Feature-flagged; does not create<br>active financing case/FRID unless<br>executive validates.|
|HOS-04|Case lookup|Search by hospital case reference,<br>patient-safe key or FRID.|Only own hospital/branch; no broad<br>cross-hospital search.|
|HOS-05|Demand submission|Add/confirm advance, pre-<br>procedure, interim or final hospital<br>demand; upload evidence if<br>permitted.|Demand can be submitted by<br>authorised finance role; maker-<br>checker for corrections.|
|HOS-06|Funding status|Submitted, lender review,<br>sanctioned, awaiting borrower<br>action, disbursement status.|No private credit decision details<br>beyond status disclosure allowed by<br>agreement.|
|HOS-07|Receipt confirmation|Confirm credited<br>amount/date/reference or raise<br>mismatch.|Receipt confirmation is distinct from<br>lender disbursement event.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  15 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Screen ID**|**Page**|**Core elements / actions**|**Visibility constraints**|
|---|---|---|---|
|HOS-08|Case activity and documents|View allowed hospital-side demand<br>records and lender confirmation.|No borrower KYC, income,<br>PAN/Aadhaar, bureau report, full<br>KFS archive unless expressly<br>authorised.|
|HOS-09|Hospital users / branch access|Hospital admin invites staff, roles<br>and branch assignments.|Cannot assign LSP roles.|
|HOS-10|Hospital reports|Own referrals, demands, funded<br>cases, ageing, payment exceptions.|No exports containing unnecessary<br>personal/credit data.|
|HOS-11|Hospital profile and beneficiary<br>verification|Hospital contacts, bank evidence<br>status, branch code and agreement.|Bank account changes require<br>independent verification and dual<br>approval.|
|HOS-12|Hospital support / complaint|Raise case-specific query or<br>dispute.|Ticket scope limited to own hospital<br>data.|



### **6.6 Borrower mobile-web / native-app pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Rules**|
|---|---|---|---|
|BOR-01|Welcome / sign-in|Phone/email, OTP and privacy links.|Do not allow standalone loan<br>origination.|
|BOR-02|Link financing case|Scan QR or enter FRID; verification<br>and consent to link.|Only valid executive-created FRID;<br>rate-limited; one-time token.|
|BOR-03|Linked case overview|Hospital/branch, case ID, patient<br>role, pending actions and status.|No unrelated borrower or hospital<br>case data.|
|BOR-04|My applications|Lender application references,<br>stages, pending actions and<br>timestamps.|Lender decision source of truth.|
|BOR-05|Complete application|Lender-required personal,<br>occupation, income and other<br>approved fields.|Borrower enters/reviews own data;<br>lender-defined schema/version.|
|BOR-06|Consent and data sharing|Purpose-specific permission,<br>recipient, data categories, retention<br>explanation and withdrawal route.|No bundled/forced consent where<br>separate choices required.|
|BOR-07|KYC handoff / status|Secure lender/provider redirect or<br>embedded authorised flow.|Do not store biometric data or<br>credentials in LSP app.|
|BOR-08|Lender offers comparison|Offer name, lender, amount, tenure,<br>APR, instalment, charges, KFS.|Only if multi-lender flow is active;<br>unbiased fair comparison.|
|BOR-09|KFS and loan agreement|Open/download lender-issued<br>document, accept/sign at lender<br>endpoint.|Lender executes; versioned<br>document reference.|
|BOR-10|Additional funding request|See hospital demand and request<br>details; confirm borrower<br>authorisation.|Only lender facility allowing<br>additional drawdown; lender<br>authentication applies.|
|BOR-11|Disbursement timeline|Each confirmed lender<br>disbursement, amount, beneficiary<br>and reference.|No false credited state from request<br>submission.|
|BOR-12|Loan information|Outstanding balance, schedule,<br>repayment, statements and<br>charges.|Use lender-provided data; stale<br>timestamp shown; no LSP-<br>calculated authoritative balance.|
|BOR-13|Hospital episode expense journal<br>(optional)|Borrower manually records personal<br>costs relevant to the episode.|Personal and separate; not family<br>contribution tracking; legal/data<br>gate.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  16 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Screen ID**|**Page**|**Core elements / actions**|**Rules**|
|---|---|---|---|
|BOR-14|Notifications|Application updates, lender actions,<br>due reminders if supplied, case<br>activity.|No sensitive details in lock-screen<br>previews by default.|
|BOR-15|Help / complaints|LSP support, lender grievance<br>contacts and complaint reference.|Show correct responsible entity and<br>escalation.|
|BOR-16|Profile / privacy centre|Account details, active devices,<br>linked cases, consent history and<br>request routes.|Data access/deletion subject to<br>legal retention and lender<br>obligations.|
|BOR-17|Install / app handoff|App store links and secure<br>continuation after install.|Preserve case via secure link or<br>authenticated account; do not<br>expose FRID in analytics.|



### **6.7 Internal support/compliance pages** 

|**Screen ID**|**Page**|**Core elements / actions**|**Restrictions**|
|---|---|---|---|
|SUP-01|Support ticket queue|Issue category, owner, SLA, priority<br>and case reference.|Mask borrower data.|
|SUP-02|Ticket detail|Conversation, approved event view,<br>response templates, escalation.|No lender-side changes.|
|CMP-01|Consent audit|Notice version, purpose, affirmative<br>action, timestamp, channel,<br>recipient and withdrawal.|Read-only evidence.|
|CMP-02|Data request queue|Access/correction/withdrawal/<br>deletion request status.|Coordinate with lender as data<br>fiduciary/processor roles require.|
|CMP-03|Access audit|Who viewed/exported what, when,<br>why, from which role/device.|Tamper-evident.|
|CMP-04|Partner compliance tracker|Agreement, due diligence, audit,<br>training, privacy, security and<br>grievance evidence.|Compliance owner only.|
|CMP-05|Incident register|Incident, impact, containment,<br>notification assessment,<br>remediation.|Need-to-know access.|



## **7. End-to-end business and user journeys** 

### **7.1 Journey A — executive-assisted case initiation** 

**1.** Hospital staff or patient directs borrower to the financing desk. Executive explains that the company facilitates an application; the NBFC makes the decision and sets terms. 

**2.** Executive selects verified hospital organisation and branch. 

**3.** Executive identifies patient and proposed borrower separately; records who is receiving treatment and who may borrow. 

**4.** Executive captures minimum contact and episode reference needed to create the case. 

**5.** Executive records first hospital demand: demand type, amount, required-by date/time, evidence reference and hospital verifier. 

**6.** System performs duplicate search using privacy-safe matching signals. Potential duplicate is displayed for review; no silent merge. 

**7.** Executive reviews summary and creates financing case. System generates immutable CASE_ID and unique FRID; logs creator, date/time, hospital, branch and source. 

**8.** System generates secure invitation link/QR bound to the case and intended borrower contact. 

**9.** Executive shares link and records delivery channel; borrower receives independent verification. 

**10.** Case enters BORROWER_LINK_PENDING then BORROWER_LINKED; executive can track but cannot complete borrower declarations. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  17 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

### **7.2 Journey B — borrower links mobile web or native app** 

**1.** Borrower scans QR or opens secure link; if app is not installed, mobile web opens. If app is installed, deep link opens app. 

**2.** Borrower authenticates via verified contact method and proves possession of valid invitation. 

**3.** System confirms FRID exists, is active, is not revoked/expired and has not been linked contrary to policy. 

**4.** Borrower sees a minimal confirmation screen: hospital, patient relationship, case purpose and whether borrower and patient are different people. 

**5.** Borrower explicitly confirms link and receives privacy notice / purpose-specific consent. 

**6.** System creates CASE_PARTY relationship with borrower role and records invitation consumption. 

**7.** Borrower can continue application in browser or choose to install/open native app; case context transfers securely, not by exposing FRID as reusable credential. 

**8.** If borrower already has account, existing account is linked after re-authentication; if no account, account is created. 

**9.** If link fails, provide safe recovery: request new invitation from executive or contact support; never reveal whether another person owns a FRID. 

### **7.3 Journey C — patient and borrower are different people** 

**1.** Executive records patient as the person admitted/treated and borrower as the person applying for finance. 

**2.** Borrower relationship to patient is recorded only if required for lender application or operations. 

**3.** Patient is not automatically granted access to borrower loan terms or financial profile. 

**4.** Borrower is not automatically granted access to full clinical records; LSP does not collect these. 

**5.** If lender requires co-applicant/guarantor, each participant receives their own invite, notice and identity verification. 

**6.** Borrower is the sole person authorised to consent to their own loan/application. Patient consent is separately required for patient data where applicable. 

### **7.4 Journey D — application submission and lender decision** 

**1.** Borrower opens case and chooses “Continue application”. This action is available only on an executive-generated, valid FRIDlinked case. 

**2.** Borrower reviews pre-filled case details and corrects information; any changes to hospital/patient facts are versioned and may require executive/hospital verification. 

**3.** Borrower completes lender-required data, including age, occupation, income and other fields required by lender policy. 

**4.** Borrower views a separate notice that identifies the data being collected, purpose, recipient lender, and consent choices. 

**5.** Borrower completes lender KYC using lender-approved flow; LSP does not store biometrics or KYC secrets. 

**6.** System submits application through the lender adapter or approved secure/manual process; records LSP APP_ID and lender reference. 

**7.** Lender returns pending / additional information / offer / declined / sanctioned / error. Status is mapped without losing lender raw status. 

**8.** If multiple lender agreements are active, matching and unmatched lender display, objective comparison and KFS links follow RBI requirement and documented matching logic. 

**9.** Borrower views lender-issued KFS and offer details; borrower chooses or declines. 

**10.** Loan agreement and e-sign occur through lender-controlled or approved flow; lender sends signed documents to verified contact. 

**11.** Application status and all pending actions appear in borrower app and executive view with last-updated time. 

### **7.5 Journey E — additional hospital demand after initial application** 

**1.** Hospital or executive captures a new demand against the existing financing case: pre-surgery advance, interim bill, further deposit or discharge balance. 

**2.** System creates DEMAND_ID and links hospital/branch, amount, currency, demand category, due time and source evidence. 

**3.** Demand is confirmed by an authorised hospital user or through the agreed evidence/callback protocol. 

**4.** System determines whether an active lender sanction/facility exists and whether product configuration supports further drawdown. 

**5.** If not supported, system does not imply availability. It routes the case to a new lender-approved application/top-up process or displays “additional financing not supported under current facility”. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  18 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

**6.** If supported, LSP creates FUNDING_REQUEST_ID linked to DEMAND_ID and the lender’s facility reference. 

**7.** Borrower sees exact hospital, amount, purpose, current known facility information and any lender-defined charges/impact. 

**8.** Borrower explicitly authorises the funding request using lender-approved authentication. 

**9.** Lender checks remaining limit, validity, conditions and authorises or rejects drawdown. 

**10.** If authorised, lender disburses directly to verified hospital beneficiary where specific end-use conditions permit; LSP never receives funds. 

**11.** Lender sends status and transaction reference. LSP records lender event. Hospital separately confirms receipt. 

**12.** If the demand is changed/cancelled after borrower authorisation, the request is stopped or amended only through lenderdefined process; audit history remains. 

### **7.6 Journey F — lender declines / borrower abandons / pending** 

**1.** Decline: show only lender-provided reason/category that may lawfully be disclosed; do not invent a reason. Provide support route; do not promise approval from another lender. 

**2.** Pending: show pending entity and timestamp; create follow-up task and escalation threshold. 

**3.** Additional information: borrower receives secure request with document/data purpose and due time. 

**4.** Borrower abandons: preserve partial progress only to extent permitted; apply retention/deletion rules; offer a secure resume path. 

**5.** Withdraws consent: stop future optional processing and sharing as legally required; inform lender and retain evidence/records where mandatory. 

**6.** Lender times out: mark status UNKNOWN/PENDING_CONFIRMATION, query lender safely and avoid duplicate submission. 

**7.** Duplicate application response: reconcile using lender reference and idempotency key; never create duplicate loan application by blind retry. 

### **7.7 Journey G — failed, returned or uncertain disbursement** 

**1.** LSP receives lender disbursement event. Event includes loan account/facility reference, transaction reference, amount, beneficiary identifier, date/time, and status where supplied. 

**2.** If lender says SUCCESS/credited, record as lender-confirmed but distinguish from hospital acknowledgement. 

**3.** If hospital reports not received, open PAYMENT_MISMATCH exception; do not change state to failed without lender/bank evidence. 

**4.** If event indicates failed, returned or reversed, record separate reversal/return event; do not delete original disbursement. 

**5.** If response is missing, state remains UNKNOWN/PENDING_CONFIRMATION; initiate idempotent status enquiry. 

**6.** Operations contacts lender through approved channel; hospital confirms its bank statement/receipt through its authorised user. 

**7.** Resolve only with evidence; capture who confirmed, evidence reference, amount and date. 

### **7.8 Journey H — discharge and case closure** 

**1.** Hospital finalises its own bill and reconciles advances, credits and adjustments in hospital system. LSP does not perform hospital accounting. 

**2.** Hospital may provide a final status/receipt summary if permitted by agreement and required for financing case evidence. 

**3.** LSP compares its recorded demands and lender-confirmed disbursements for operational completeness; it does not calculate family contributions or determine hospital balance due. 

**4.** Any excess, refund or bill adjustment is handled between hospital and relevant party under their own arrangement; if it changes loan principal/repayment, lender must process the adjustment. 

**5.** LSP marks service case CLOSED only when its operational tasks are complete or closes with an explicit unresolved reason. 

**6.** Borrower loan account remains OPEN/ACTIVE until lender reports closure/repayment completion. Hospital billing case closure remains hospital’s responsibility. 

### **7.9 Journey I — optional expense journal in native app** 

PROPOSED / LEGAL-GATED. The journal is a borrower-controlled personal note of expenses the borrower chooses to record. It is not a hospital ledger, loan statement, family contribution tracker, insurance claim calculator or receipt repository by default. 

**1.** Feature is opt-in and clearly separate from “Loan / financing”. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  19 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

**2.** Borrower can enter category, amount, date and short note; family contributor names/splits are not requested. 

**3.** No automatic access to photos, files, contacts, call logs or media. A user-initiated camera/file selection, if ever introduced, requires separate approval and may still be disallowed by partner policy. 

**4.** No expense data is shared with lender, hospital, executive, analytics or marketing by default. 

**5.** Storage model is not assumed. Local-only storage still needs regulatory/legal review because the app may be a DLA and data handling is regulated. Cloud sync, receipt uploads and document vault are OFF until approved. 

**6.** Borrower can edit/delete entries, export personally where lawful, and see a clear disclaimer that this journal is not the official loan balance or hospital bill. 

### **7.10 Journey J — complaints, support and data rights** 

**1.** Borrower can lodge a complaint from public website or app; system records complaint ID, date, category, involved lender/case and requested outcome. 

**2.** Classify responsibility: LSP conduct/technology, lender decision/pricing/repayment, hospital demand/receipt, third-party vendor. 

**3.** Route complaint to the correct lender grievance officer and LSP nodal officer without making borrower repeat facts unnecessarily. 

**4.** Show complaint owner, acknowledgement, status and escalation path. 

**5.** Maintain regulatory escalation information and applicable 30-day RBI CMS eligibility wording as supplied by lender/legalapproved content. 

**6.** Data access/correction/withdrawal/deletion requests are logged and routed to the relevant data fiduciary/controller. Do not promise deletion where lender/legal retention duties prevent it. 

## **8. Business rules, identifiers and state machines** 

### **8.1 Identifier catalogue** 

|**ID**|**Object**|**Rule**|
|---|---|---|
|ORG_ID|Organisation|Unique legal/entity identifier for LSP, hospital,<br>lender or service partner.|
|BRANCH_ID|Hospital branch|Unique branch identity under hospital<br>organisation.|
|USER_ID|User|Unique workforce or borrower account ID; no<br>shared workforce ID.|
|PATIENT_ID|Patient|Internal random ID; patient can exist without<br>being borrower.|
|BORROWER_ID|Borrower|Internal identity/account ID separate from patient<br>ID.|
|CASE_ID|Financing case|Immutable internal ID for one<br>hospitalisation/treatment financing episode.|
|FRID|Financing Reference ID|Unique borrower-facing reference created only<br>after executive initiates case; not a credential.|
|INVITE_ID|Invitation|One-time invitation record tied to case and<br>intended contact; token secret stored hashed.|
|DEMAND_ID|Hospital demand|One distinct payment<br>demand/estimate/advance/interim/final demand.|
|FUNDING_REQUEST_ID|Funding request|Request to lender to finance a specific demand or<br>permitted utilisation.|
|APP_ID|LSP application|Internal identifier for a lender application<br>attempt.|
|LENDER_APP_REF|Lender application|External lender identifier; authoritative at lender.|
|OFFER_ID|Offer|Lender-issued offer instance and version.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  20 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Object**|**Rule**|
|---|---|---|
|SANCTION_ID|Sanction|Lender sanction reference and conditions.|
|FACILITY_ID|Facility|Lender-defined approved facility/limit if product<br>uses one.|
|DRAWDOWN_ID|Drawdown|Lender-approved utilisation reference; only if<br>multi-drawdown exists.|
|DISBURSEMENT_ID|Disbursement|Lender transaction reference and event; not<br>equated with hospital receipt.|
|LOAN_ACCOUNT_REF|Loan account|External lender account reference; LSP maintains<br>mapped reference only.|
|RECEIPT_ID|Hospital receipt|Hospital-side confirmation of credited funds.|
|CONSENT_ID|Consent event|Purpose, text/version, subject, action, timestamp<br>and recipient.|
|DOC_REF|Document reference|Metadata/link/reference; stored file only if<br>permitted.|
|TICKET_ID|Support / complaint|Unique service ticket identifier.|
|EVENT_ID|Audit/integration event|Immutable event identifier with source and<br>idempotency key.|



### **8.2 Case hierarchy** 

Organisation → Hospital Branch → Patient → Borrower (may be different) → Financing Case → one FRID → one or more Hospital Demands → one or more Funding Requests → one or more Lender Applications / Offers / Sanctions / Facilities → one or more Drawdowns (only if supported) → one or more Disbursements → hospital receipt confirmations. A case can have multiple app users only where separate party roles are defined and authorised. 

### **8.3 Case status model** 

|**State**|**Meaning**|**Allowed next states / notes**|
|---|---|---|
|DRAFT|Executive started but required details<br>incomplete.|READY_FOR_INVITATION, CANCELLED.|
|READY_FOR_INVITATION|Minimum case data and hospital association<br>validated.|INVITATION_SENT, ON_HOLD.|
|INVITATION_SENT|Secure invitation issued.|BORROWER_LINKED, INVITATION_EXPIRED,<br>CANCELLED.|
|BORROWER_LINKED|Borrower identity/account linked to case.|APPLICATION_IN_PROGRESS, ON_HOLD,<br>WITHDRAWN.|
|APPLICATION_IN_PROGRESS|Borrower completing lender application.|SUBMITTED, ABANDONED, WITHDRAWN.|
|SUBMITTED|Lender application submission confirmed.|LENDER_PENDING, ACTION_REQUIRED,<br>DECIDED, UNKNOWN.|
|LENDER_PENDING|Lender processing.|ACTION_REQUIRED, SANCTIONED, DECLINED,<br>UNKNOWN.|
|ACTION_REQUIRED|Borrower/lender document or action required.|SUBMITTED, LENDER_PENDING, WITHDRAWN.|
|SANCTIONED|Lender confirms sanction.|AGREEMENT_PENDING,<br>DISBURSEMENT_PENDING, DECLINED/EXPIRED<br>only by lender update.|
|AGREEMENT_PENDING|Borrower must review/execute lender<br>documents.|AGREEMENT_EXECUTED, EXPIRED,<br>WITHDRAWN.|
|AGREEMENT_EXECUTED|Lender confirms execution.|DISBURSEMENT_PENDING, ACTIVE, CANCELLED<br>per lender.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  21 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**State**|**Meaning**|**Allowed next states / notes**|
|---|---|---|
|DISBURSEMENT_PENDING|Lender processing disbursement.|PARTIALLY_DISBURSED, DISBURSED, FAILED,<br>UNKNOWN.|
|PARTIALLY_DISBURSED|Some but not all expected amounts confirmed.|DISBURSEMENT_PENDING, DISBURSED,<br>EXCEPTION.|
|DISBURSED|Lender confirms intended disbursement(s).|ADDITIONAL_DEMAND, SERVICE_COMPLETE,<br>EXCEPTION.|
|DECLINED|Lender declined application.|New distinct application only if permitted; not<br>editable to approved.|
|WITHDRAWN|Borrower withdrew/consent withdrawn.|Closed or new application under new consent.|
|ON_HOLD|Operational/compliance/fraud hold.|Resume or CANCELLED with reason.|
|SERVICE_COMPLETE|LSP workflow complete.|CLOSED.|
|CLOSED|LSP service case closed.|No reopen except controlled correction/reopen<br>event.|



_Case state is a summary. It must not overwrite individual demand, application, drawdown or disbursement states. Case closure is not loan closure._ 

### **8.4 Demand state model** 

|**State**|**Meaning / control**|
|---|---|
|DRAFT|Created but not submitted.|
|SUBMITTED|Demand submitted by authorised hospital/executive with evidence.|
|VERIFICATION_PENDING|Hospital verification or additional evidence required.|
|VERIFIED|Demand amount/beneficiary/purpose confirmed under hospital protocol.|
|FUNDING_REQUESTED|A funding request has been created; not a loan approval.|
|PARTIALLY_FUNDED|Some amount is lender-confirmed as disbursed.|
|FUNDED|Demand amount fully covered by lender-confirmed disbursements; do not<br>include family contribution.|
|REJECTED|Demand invalid/unsupported; reason captured.|
|CANCELLED|Hospital cancelled or superseded demand.|
|DISPUTED|Borrower/hospital/LSP disputes amount or evidence.|



### **8.5 Funding request / drawdown / disbursement states** 

|**Object**|**States**|**Rules**|
|---|---|---|
|Funding request|DRAFT → PENDING_BORROWER_AUTH →<br>AUTHORISED → SENT_TO_LENDER →<br>LENDER_PENDING → APPROVED / REJECTED /<br>EXPIRED / CANCELLED / UNKNOWN|Borrower authorisation must be recorded per<br>lender requirement. LSP cannot convert a request<br>to approval.|
|Drawdown|NOT_SUPPORTED / REQUESTED / APPROVED /<br>DECLINED / EXPIRED / REVERSED|Only create if lender product exposes drawdown<br>facility. Never manufacture a drawdown record<br>from a generic payment demand.|
|Disbursement|INITIATED / PROCESSING /<br>CONFIRMED_BY_LENDER / FAILED / RETURNED /<br>REVERSED / UNKNOWN|Source of truth is lender event or permitted bank<br>evidence. Hospital receipt confirmation is<br>separate.|
|Receipt|NOT_REQUESTED / AWAITING_HOSPITAL /<br>CONFIRMED / MISMATCH / DISPUTED|Hospital receipt is not inferred from lender<br>disbursement response.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  22 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

### **8.6 Application status mapping** 

Store both raw lender status and normalised LSP status. Mapping is lender-specific and versioned. Unknown values must map to UNKNOWN and open an integration/operations exception; they must not be silently mapped to approved or declined. 

### **8.7 Non-negotiable business rules** 

- A case is not a loan. A demand is not a funding request. A funding request is not a drawdown. A drawdown is not a disbursement. A disbursement is not proof the hospital has reconciled its bill. 

- Every case has one immutable CASE_ID and one active FRID; replacement FRID requires revocation and new invitation audit trail. 

- Only authorised LSP executive initiates and activates a financing case/FRID. Hospital referral may create a draft/referral only if feature is approved. 

- Borrower must be explicitly identified and verified; patient and borrower cannot be implicitly merged. 

- No LSP user may enter borrower OTP, PIN, password or execute consent/loan agreement on borrower’s behalf. 

- No new drawdown without lender product capability, remaining facility eligibility, required borrower authorisation and lender approval. 

- No loan offer/rate/tenure/EMI derived by LSP unless returned by lender source or an approved disclosed calculator. 

- No manual change of lender-decision or disbursement status without source evidence; corrections append a new event. 

- Hospital beneficiary details must be verified; beneficiary changes are high-risk and require maker-checker plus out-of-band confirmation. 

- Family contribution remains outside all demand, funding, disbursement and reporting calculations. 

- Native app installation is optional. Mobile web supports core borrower journey. 

- No case can be originated from a native app without a valid executive-generated FRID. 

- LSP service closure, hospital billing closure and lender loan-account closure are distinct statuses. 

- The lender remains responsible for underwriting, loan terms, loan account, repayment, credit bureau reporting and mandated grievance accountability. 

## **9. Functional requirements and acceptance criteria** 

_Requirements use stable IDs. Priority: P0 = required for safe operation; P1 = required for complete target workflow; P2 = optional/advanced. Status indicates founder confirmation or dependency._ 

### **9.1 Identity, access and organisation** 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-IAM-001|The system shall maintain<br>unique user identities for every<br>workforce, hospital and<br>borrower account.|Two staff cannot share the<br>same active account;<br>deactivation blocks new<br>sessions and revokes existing<br>sessions within the configured<br>security window.|P0|PROPOSED|
|FR-IAM-002|The system shall support role-<br>based access and attribute-<br>based record/field<br>restrictions.|A hospital user cannot retrieve<br>another hospital’s case<br>through UI or direct API; API<br>returns denied response and<br>logs attempt.|P0|PROPOSED|
|FR-IAM-003|The system shall support<br>organisation and branch<br>hierarchy.|Hospital users can be scoped<br>to one or more authorised<br>branches; moving branch<br>membership changes access<br>without changing case history.|P0|PROPOSED|
|FR-IAM-004|The system shall enforce MFA<br>for privileged workforce roles.|Admin, operations, executive,<br>support, compliance and<br>hospital admin login cannot<br>complete without required<br>second factor.|P0|PROPOSED|
|FR-IAM-005|The system shall support<br>account invitation, activation,<br>suspension, deactivation and<br>reactivation.|Every lifecycle event records<br>actor, timestamp, reason and<br>prior/new state.|P0|PROPOSED|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  23 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-IAM-006|The system shall support<br>permission templates and<br>versioned policy changes.|Permission change requires<br>appropriate admin approval,<br>effective date and audit event;<br>existing sessions are re-<br>evaluated.|P0|PROPOSED|
|FR-IAM-007|The system shall provide<br>secure account recovery and<br>session/device management.|Recovery does not disclose<br>whether an account exists;<br>borrower can revoke a lost<br>device; workforce recovery<br>requires verified admin<br>process.|P1|PROPOSED|
|FR-IAM-008|The system shall support time-<br>bound privileged access.|Temporary access requires<br>reason, approver and expiry;<br>access expires automatically<br>and is reviewable.|P1|PROPOSED|
|FR-IAM-009|The system shall distinguish<br>patient, borrower, co-<br>applicant and guarantor<br>identities/roles.|A case may record patient_id<br>and borrower_id separately;<br>permissions follow participant<br>role, not assumed identity<br>equality.|P0|CONFIRMED|
|FR-IAM-010|The system shall prevent<br>unauthorised self-assignment<br>of privileged roles.|A user cannot grant<br>themselves<br>admin/compliance privileges;<br>privileged role grant requires a<br>separate authorised actor.|P0|PROPOSED|



### **9.2 Case initiation, FRID and borrower linking** 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-CASE-001|The system shall allow an<br>authorised executive to create<br>a financing case<br>independently of hospital<br>software.|Executive can create a case<br>using the standalone portal;<br>no HMS integration is required<br>or called.|P0|CONFIRMED|
|FR-CASE-002|The system shall require a<br>verified hospital organisation<br>and branch on every hospital<br>financing case.|Case cannot become active<br>without active<br>hospital/branch; inactive<br>hospital cannot be selected.|P0|PROPOSED|
|FR-CASE-003|The system shall capture<br>patient and borrower as<br>separate case parties.|Patient=borrower and<br>patient≠borrower paths both<br>work; required role labels are<br>shown.|P0|CONFIRMED|
|FR-CASE-004|The system shall create<br>immutable CASE_ID after<br>minimum case validation.|ID is unique,<br>non-sequential/unguessable<br>externally and never reused<br>after cancellation.|P0|PROPOSED|
|FR-CASE-005|The system shall generate<br>FRID only when an authorised<br>executive initiates/activates<br>the case.|No borrower app user can<br>create an active FRID or<br>application without a valid<br>executive-created case.|P0|CONFIRMED|
|FR-CASE-006|The system shall generate a<br>secure invitation bound to<br>case and intended borrower<br>contact.|Expired, revoked, consumed<br>or mismatched invitation<br>cannot link another account;<br>token is single-use or policy<br>controlled.|P0|PROPOSED|
|FR-CASE-007|The system shall allow<br>executive to resend/revoke<br>invitations.|Resend creates a new token,<br>old token is invalidated per<br>policy and all events are<br>logged.|P1|PROPOSED|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  24 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-CASE-008|The system shall perform<br>duplicate case checks before<br>activation.|Potential duplicates display<br>match reason and require<br>review; no silent merge or data<br>disclosure to unauthorised<br>users.|P0|PROPOSED|
|FR-CASE-009|The system shall allow an<br>existing borrower account to<br>link a new FRID after<br>verification.|Account can have several valid<br>cases; each link records<br>consent, identity verification<br>and time.|P1|PROPOSED|
|FR-CASE-010|The system shall preserve an<br>auditable case timeline.|Case events are append-only;<br>edits are represented as<br>superseding events with actor<br>and reason.|P0|PROPOSED|



### **9.3 Hospital and demand management** 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-DEM-001|The system shall capture<br>hospital payment demands<br>under an existing financing<br>case.|Each demand receives<br>DEMAND_ID and links to<br>CASE_ID, hospital, branch,<br>amount, currency, category<br>and evidence reference.|P0|CONFIRMED|
|FR-DEM-002|The system shall support<br>multiple demands in one<br>financing case.|At least multiple<br>advance/interim/discharge<br>demands can be recorded<br>without creating a duplicate<br>case.|P0|CONFIRMED|
|FR-DEM-003|The system shall support<br>demand types.|Configurable types include<br>initial advance, pre-procedure<br>advance, interim bill,<br>discharge balance, other<br>approved demand.|P1|PROPOSED|
|FR-DEM-004|The system shall capture<br>demand timing and urgency.|Required-by date/time, source<br>and submitter are stored;<br>overdue queue can be filtered.|P1|PROPOSED|
|FR-DEM-005|The system shall support<br>demand evidence metadata<br>and permitted evidence<br>upload/reference.|Accepted evidence types and<br>retention are configurable;<br>disallowed document storage<br>is blocked.|P0|LEGAL-GATED|
|FR-DEM-006|The system shall support<br>hospital verification or<br>authorised verification<br>protocol.|Demand cannot become<br>VERIFIED unless an authorised<br>hospital verifier or approved<br>evidence protocol confirms it.|P0|PROPOSED|
|FR-DEM-007|The system shall preserve<br>changed/cancelled demands.|Original amount and status<br>remain in history; corrected<br>demand is new version/event.|P0|PROPOSED|
|FR-DEM-008|The system shall support<br>hospital portal demand entry<br>only when enabled.|Hospital staff can submit only<br>within their<br>organisation/branch;<br>executive validation remains<br>required for FRID case<br>activation.|P2|PROPOSED|
|FR-DEM-009|The system shall provide<br>hospital beneficiary<br>verification status.|Disbursement request cannot<br>be submitted with<br>unverified/expired beneficiary<br>account metadata.|P0|PROPOSED|
|FR-DEM-010|The system shall distinguish<br>hospital demand from<br>family/patient contribution.|No field or workflow requires<br>the LSP to capture, calculate,<br>reconcile or allocate family<br>contributions.|P0|CONFIRMED|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  25 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

### **9.4 Application, lender, offer and consent orchestration** 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-LND-001|The system shall maintain a<br>configurable lender and loan-<br>product directory.|Each product has lender,<br>eligibility metadata, required<br>fields, channels, status,<br>version and effective dates.|P0|DEPENDENT|
|FR-LND-002|The borrower shall be able to<br>continue application only after<br>an executive-created FRID has<br>been linked.|Direct app entry without a<br>valid linked case displays a<br>non-originating state and<br>provides desk/referral<br>guidance.|P0|CONFIRMED|
|FR-LND-003|The borrower shall personally<br>complete lender-required<br>application information.|Required declarations are<br>shown to borrower; executive<br>cannot submit on borrower’s<br>behalf.|P0|CONFIRMED|
|FR-LND-004|The system shall capture<br>lender-required age,<br>occupation, income and other<br>configured fields.|Schema is lender/product-<br>specific and versioned;<br>mandatory validation occurs<br>before submission.|P0|DEPENDENT|
|FR-LND-005|The system shall capture<br>granular, purpose-specific<br>consent records.|Each consent records subject,<br>notice version, purpose, data<br>categories, recipient, channel,<br>timestamp and affirmative<br>action.|P0|PROPOSED|
|FR-LND-006|The system shall create LSP<br>APP_ID and preserve lender<br>reference.|Every application submission<br>has idempotency key,<br>request/response audit and<br>raw/normalised status.|P0|PROPOSED|
|FR-LND-007|The system shall support<br>lender API, approved secure-<br>file and controlled manual<br>portal fallback.|All methods produce<br>consistent application status<br>and evidence; manual entry<br>records operator and<br>reference.|P1|DEPENDENT|
|FR-LND-008|The system shall display<br>lender decision status and<br>pending action.|Status includes source lender,<br>received timestamp and last<br>updated time; unknown<br>statuses are not mapped to<br>success.|P0|DEPENDENT|
|FR-LND-009|The system shall support<br>multiple lender routing only<br>where there are active<br>contracts.|Matching logic is consistent,<br>documented, versioned and<br>supports required lender<br>disclosure.|P1|DEPENDENT|
|FR-LND-010|The system shall display all<br>matching offers and<br>unmatched lender names<br>when required by RBI multi-<br>lender arrangements.|Each matching offer shows<br>lender, amount, tenor, APR,<br>monthly repayment, penal<br>charges and KFS link in fair<br>comparable view.|P0|LEGAL-GATED|
|FR-LND-011|The system shall avoid biased<br>or deceptive offer<br>presentation.|Offer ordering follows pre-<br>disclosed metric; no dark<br>pattern, preselected lender or<br>obscured total costs.|P0|CONFIRMED|
|FR-LND-012|The system shall display<br>lender-issued KFS and digital<br>loan documents.|Borrower can view/download<br>lender-originated documents<br>with issuer, issue time and<br>version; signed docs sent by<br>lender to verified channel.|P0|DEPENDENT|
|FR-LND-013|The system shall keep credit<br>decision and loan pricing<br>lender-controlled.|LSP roles cannot alter<br>sanction, APR, tenure,<br>eligibility, decision reason or<br>credit limit.|P0|CONFIRMED|
|FR-LND-014|The system shall capture<br>borrower acceptance, decline<br>or withdrawal of lender offer.|Action is explicit,<br>timestamped, tied to offer<br>version and sent to lender as<br>required.|P0|DEPENDENT|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  26 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-LND-015|The system shall respect<br>lender cooling-off and<br>prepayment information.|Applicable period and<br>permitted process are shown<br>from lender product<br>configuration/KFS; not hard-<br>coded universally.|P0|DEPENDENT|



### **9.5 Additional funding, drawdown and disbursement** 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-FND-001|The system shall create a<br>funding request linked to a<br>verified hospital demand.|FUNDING_REQUEST_ID links<br>to DEMAND_ID, CASE_ID,<br>lender facility/application<br>reference and requested<br>amount.|P0|CONFIRMED|
|FR-FND-002|The system shall distinguish<br>single disbursement, multi-<br>drawdown facility and<br>separate new-loan/top-up<br>path.|Lender product configuration<br>declares supported structure;<br>unsupported structure cannot<br>be requested as a tranche.|P0|DEPENDENT|
|FR-FND-003|The system shall require<br>borrower authorisation for<br>each additional drawdown<br>where lender requires it.|Amount, hospital, purpose<br>and lender-provided<br>cost/impact are shown before<br>lender-approved<br>authentication.|P0|PROPOSED|
|FR-FND-004|The system shall display<br>remaining facility amount only<br>from lender source.|No local arithmetic is<br>displayed as available credit<br>unless reconciled to latest<br>lender facility response and<br>labelled timestamp.|P0|DEPENDENT|
|FR-FND-005|The system shall record<br>drawdown approval/decline<br>separately from funding<br>request.|Drawdown status and lender<br>drawdown ID are stored only<br>when lender supplies them.|P0|DEPENDENT|
|FR-FND-006|The system shall track<br>disbursement lifecycle<br>separately from hospital<br>receipt.|Lender-confirmed transfer and<br>hospital receipt<br>acknowledgement are<br>separate records and states.|P0|CONFIRMED|
|FR-FND-007|The system shall support<br>disbursement failure, return,<br>reversal and unknown states.|Original transaction remains;<br>reversal is separate event;<br>unresolved transaction enters<br>exception queue.|P0|PROPOSED|
|FR-FND-008|The system shall not receive or<br>route loan funds.|No LSP bank/pool account is<br>configured as borrower/loan<br>disbursement path; payment<br>instructions come from<br>lender.|P0|CONFIRMED|
|FR-FND-009|The system shall preserve a<br>consolidated transaction<br>timeline without calculating<br>authoritative interest.|Lender dates, amounts and<br>references are shown;<br>outstanding balance/interest<br>marked as lender-reported<br>with timestamp.|P0|CONFIRMED|
|FR-FND-010|The system shall require<br>independent verification for<br>hospital beneficiary changes.|A beneficiary change triggers<br>hold, maker-checker and out-<br>of-band verification; no<br>executive self-approval.|P0|PROPOSED|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  27 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

### **9.6 Borrower app, expense journal and notifications** 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-APP-001|The native app shall support<br>optional installation and<br>authenticated access to linked<br>cases.|A borrower without a linked<br>FRID can access public/help<br>content but cannot originate a<br>loan.|P0|CONFIRMED|
|FR-APP-002|The borrower shall be able to<br>continue in mobile web<br>without native app installation.|A secure link opens the<br>equivalent core financing<br>journey in supported mobile<br>browser.|P0|CONFIRMED|
|FR-APP-003|The app shall show<br>case/application status and<br>pending borrower actions.|Status is source-attributed<br>and includes last refreshed<br>time and next action where<br>known.|P1|PROPOSED|
|FR-APP-004|The app shall show lender-<br>sourced loan information and<br>documents.|Loan balance/repayment data<br>is labelled lender-reported and<br>stale if feed age exceeds<br>configured threshold.|P1|DEPENDENT|
|FR-APP-005|The app shall support<br>notifications for critical case<br>and lender events.|User preference, consent,<br>delivery result and fallback<br>channel are recorded;<br>sensitive payload masked.|P1|PROPOSED|
|FR-APP-006|The app may offer a personal<br>expense journal separate from<br>financing ledger.|Feature is disabled until<br>legal/lender approval; no<br>family contribution fields; no<br>sync/share by default.|P2|LEGAL-GATED|
|FR-APP-007|The system shall not access<br>contacts, call logs, call<br>history, telephony or broad<br>media library.|Mobile permission audit<br>confirms no prohibited<br>collection; camera/file<br>access, if any, is one-time and<br>specifically consented.|P0|CONFIRMED|
|FR-APP-008|The system shall let borrower<br>manage linked devices and<br>sessions.|Borrower can revoke<br>device/session; revocation<br>takes effect across app and<br>web.|P1|PROPOSED|
|FR-APP-009|The system shall show LSP<br>and lender complaint routes.|Complaint button and contact<br>information are visible on<br>relevant app pages and public<br>site.|P0|PROPOSED|
|FR-APP-010|The system shall keep app<br>personal journal data<br>unavailable to hospital and<br>executive roles.|Automated access test<br>confirms no staff, hospital or<br>lender endpoint can query<br>personal journal data.|P0|LEGAL-GATED|



### **9.7 Hospital portal and partner operations** 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-HOS-001|The system shall support<br>distinct hospital organisation,<br>branch and hospital user<br>records.|Hospital admin can manage<br>own branch users but cannot<br>create LSP users or assign LSP<br>roles.|P1|PROPOSED|
|FR-HOS-002|Hospital users shall view only<br>authorised cases linked to<br>their own organisation/branch.|Cross-tenant/cross-branch<br>API access is denied and<br>logged.|P0|PROPOSED|
|FR-HOS-003|Hospital finance users may<br>submit/verify payment<br>demands.|Only authorised role can<br>submit; amendments preserve<br>history and verifier identity.|P1|PROPOSED|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  28 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-HOS-004|Hospital users shall see only<br>permitted application and<br>disbursement status.|No KYC documents, income<br>details, credit-bureau data,<br>full borrower profile or<br>unrelated loan accounts are<br>exposed.|P0|CONFIRMED|
|FR-HOS-005|Hospital users may confirm<br>credited receipt or raise<br>mismatch.|Receipt confirmation stores<br>amount, date, bank/reference<br>note and user; does not<br>rewrite lender event.|P1|PROPOSED|
|FR-HOS-006|Hospital user provisioning<br>shall be controlled by hospital<br>admin and LSP activation.|Invitation, hospital validation<br>and role assignment are<br>logged; terminated users lose<br>access.|P1|PROPOSED|
|FR-HOS-007|Hospital reports shall be<br>limited to its own aggregate<br>and case data.|Exports are scoped and<br>minimise personal fields; no<br>family contribution analytics.|P1|PROPOSED|



### **9.8 Admin, operations, audit and support** 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-OPS-001|The system shall provide case<br>queues by status, age,<br>hospital, executive, lender and<br>priority.|Filters return only role-<br>permitted records and show<br>as-of time.|P0|PROPOSED|
|FR-OPS-002|The system shall<br>assign/reassign cases and<br>tasks.|Assignment change requires<br>reason and preserves previous<br>owner and timestamp.|P1|PROPOSED|
|FR-OPS-003|The system shall provide<br>exception categories and<br>resolution evidence.|Every exception has owner,<br>severity, reason,<br>opened/resolved time, actions<br>and evidence.|P0|PROPOSED|
|FR-OPS-004|The system shall provide<br>reconciliation workbench.|Lender disbursement records,<br>LSP events and hospital<br>receipts are compared;<br>mismatches are flagged, not<br>silently adjusted.|P0|PROPOSED|
|FR-OPS-005|The system shall support<br>complaints/tickets and<br>escalation.|Ticket tracks category, party<br>responsible, owner, SLA clock,<br>resolution and borrower<br>communication.|P0|PROPOSED|
|FR-OPS-006|The system shall maintain<br>immutable audit trail for<br>critical actions.|Case changes, consent, data<br>access/export, admin<br>permission changes and<br>lender transactions have<br>actor/time/source.|P0|PROPOSED|
|FR-OPS-007|The system shall manage<br>policies, lender products and<br>disclosures with versioning.|Each case/application stores<br>applicable configuration<br>version; historic records<br>remain reproducible.|P0|PROPOSED|
|FR-OPS-008|The system shall support<br>maker-checker for sensitive<br>operations.|Beneficiary change, privileged<br>role grant, manual transaction<br>correction and high-risk export<br>require independent approval.|P0|PROPOSED|
|FR-OPS-009|The system shall provide<br>operational and management<br>reporting.|Metrics use documented<br>definitions, filters and data<br>freshness.|P1|PROPOSED|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  29 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Functional requirement**|**Acceptance criteria**<br>**(minimum)**|**Priority**|**Status**|
|---|---|---|---|---|
|FR-OPS-010|The system shall support data<br>subject request and privacy<br>incident workflow.|Request/incident owner,<br>affected systems, lender<br>coordination, deadline and<br>closure evidence are<br>recorded.|P0|PROPOSED|
|FR-OPS-011|The system shall support<br>secure manual fallback for<br>lender connectivity failure.|Manual processing requires<br>approved operator, evidence,<br>second check for financial<br>status and later reconciliation<br>to lender feed.|P1|DEPENDENT|
|FR-OPS-012|The system shall support<br>partner onboarding and due<br>diligence evidence.|Lender/hospital agreement,<br>authorised contacts,<br>beneficiary verification,<br>compliance review and<br>renewal dates are stored.|P1|PROPOSED|



## **10. Data model, entity mapping and data dictionary** 

### **10.1 Entity domain map** 



### **10.2 Core entity catalogue** 

|**Entity**|**Purpose**|**Key fields / references**|**Owner / source**|
|---|---|---|---|
|Organisation|Legal or operating entity: LSP,<br>hospital, lender, service provider.|org_id, org_type, legal_name,<br>registration refs, status, effective<br>dates.|LSP master; external evidence<br>verified.|
|HospitalBranch|Physical hospital branch/service<br>location.|branch_id, org_id, address, contact,<br>code, service status.|Hospital confirmed.|
|BeneficiaryAccount|Verified hospital bank account for<br>specific end-use disbursement.|beneficiary_id, branch_id, account<br>holder, bank, IFSC, masked<br>account, verification status,<br>effective period.|Hospital evidence plus LSP<br>verification; lender validation.|
|User|Authenticated<br>workforce/hospital/borrower<br>identity.|user_id, identity type, contact,<br>status, auth factors, last login.|LSP identity system.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  30 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Entity**|**Purpose**|**Key fields / references**|**Owner / source**|
|---|---|---|---|
|Membership|User-to-organisation/branch link.|membership_id, user_id, org_id,<br>branch_id, role, status, dates.|LSP/hospital admin with LSP<br>activation.|
|Role / Permission|RBAC template and privileges.|role_id, permissions, policy version,<br>scope.|LSP governance.|
|Patient|Person receiving care.|patient_id, minimum demographic<br>identifiers, verified contact if<br>required.|LSP minimal data; avoid clinical<br>record.|
|Borrower|Loan applicant/obligor identity<br>reference.|borrower_id, user_id, lender<br>customer ref, verified contact.|LSP account reference; lender owns<br>KYC record.|
|CaseParty|Participant-role link to case.|case_party_id, case_id, party_id,<br>role, relationship, visibility scope.|LSP.|
|FinancingCase|One hospitalisation/treatment<br>financing service episode.|case_id, hospital_id, branch_id,<br>patient_id, borrower_id, case status,<br>source, executive, created_at.|LSP case system.|
|FRIDInvitation|Borrower-facing link reference and<br>invitation.|frid, case_id, intended contact<br>hash/ref, token hash, expiry,<br>consumed/revoked status.|LSP identity/service layer.|
|HospitalDemand|Payment<br>request/estimate/advance/interim/fi<br>nal demand.|demand_id, case_id, beneficiary_id,<br>amount, currency, type, due date,<br>evidence ref, verifier, state.|Hospital assertion captured by LSP.|
|FundingRequest|Request to lender against one or<br>more permitted demands.|funding_request_id, case_id,<br>demand_id, lender/facility ref,<br>amount, status, borrower auth ref.|LSP process; lender decision<br>source.|
|LenderProduct|Lender-specific medical finance<br>product configuration.|product_id, lender_id, eligibility<br>metadata, supported drawdown<br>mode, fields schema, version.|Lender-approved configuration.|
|LoanApplication|Application attempt to one lender.|app_id, case_id, lender_id,<br>product_id, lender_app_ref, status,<br>raw status, submitted timestamp.|LSP ref + lender source.|
|Offer|Lender-issued product offer.|offer_id, app_id, amount, tenor,<br>APR, EMI, penal charges, offer<br>expiry, KFS ref, version.|Lender authoritative.|
|Sanction|Lender credit approval and terms.|sanction_id, app_id, terms ref,<br>approved amount, conditions,<br>expiry.|Lender authoritative.|
|Facility|If lender product is a limit/facility.|facility_id, sanction_id, limit, utilised<br>amount, available amount, validity,<br>status.|Lender authoritative.|
|Drawdown|Approved utilisation under a facility<br>if supported.|drawdown_id, funding_request_id,<br>facility_id, approved amount, value<br>date, lender ref, status.|Lender authoritative.|
|Disbursement|Actual funds transfer record.|disbursement_id, drawdown_id or<br>sanction ref, amount, beneficiary,<br>transaction ref, status, value date.|Lender authoritative.|
|LoanAccountReference|Reference for borrower loan<br>account.|loan_account_ref, lender_id,<br>borrower_id, lender account<br>masked ref, status, last_sync_at.|Lender authoritative.|
|HospitalReceipt|Hospital-side evidence that credit<br>was received.|receipt_id, disbursement_id,<br>received amount/date, receipt<br>reference, confirmer, mismatch<br>reason.|Hospital evidence.|
|ConsentRecord|Consent / notice evidence.|consent_id, subject, notice version,<br>purpose, data category, recipient,<br>action, timestamp, channel,<br>withdrawal.|LSP audit evidence; lender retains<br>lender consent.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  31 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Entity**|**Purpose**|**Key fields / references**|**Owner / source**|
|---|---|---|---|
|DocumentReference|Allowed document metadata or<br>secure external reference.|doc_ref, case_id, category, issuer,<br>date, hash, storage owner, retention<br>class.|Source party; storage allowed only<br>after approval.|
|Notification|Notice delivery record.|notification_id, recipient, channel,<br>template version, trigger, delivery<br>status, time.|LSP/vendor event.|
|SupportTicket|Support/complaint record.|ticket_id, case_id, complainant,<br>category, lender/hospital party,<br>status, SLA, resolution.|LSP and lender complaint systems<br>as applicable.|
|AuditEvent|Immutable security and business<br>event.|event_id, actor, action, entity,<br>entity_id, before/after hash/ref,<br>timestamp, device, source.|LSP audit store.|
|IntegrationEvent|Inbound/outbound external<br>message.|event_id, partner, event_type,<br>external_ref, idempotency key,<br>payload hash, receipt time,<br>processing state.|LSP integration layer.|
|Exception|Operational or technical anomaly.|exception_id, case_id, category,<br>severity, owner, opened/resolved,<br>evidence and disposition.|LSP operations.|
|ExpenseEntry|Optional personal expense journal<br>item.|expense_id, borrower_id, category,<br>amount, date, note, storage mode.|Borrower only; legal-gated and<br>isolated.|



### **10.3 Relationship and cardinality rules** 

|**Relationship**|**Cardinality**|**Rule**|
|---|---|---|
|Organisation → Branch|1 : many|Only hospital organisations have hospital<br>branches in this domain; lender/LSP may use own<br>organisational structure separately.|
|Organisation → User membership|1 : many|Users may have multiple memberships only<br>where approved.|
|Patient → Financing Case|1 : many|A patient may have multiple episodes over time.|
|Borrower → Financing Case|1 : many|A borrower may finance more than one<br>patient/episode, subject to lender policy.|
|Financing Case → FRID|1 : 1 active; 1 : many historical|Only one active FRID at a time; revoked/expired<br>history retained.|
|Financing Case → Demand|1 : many|Multiple staged demands can exist per episode.|
|Demand → Funding Request|1 : many or 1 : 0..many|Partial funding, retries or separate permitted<br>lender requests may occur; no duplicate active<br>request without idempotency check.|
|Financing Case → Application|1 : many|One case may have applications to different<br>lenders or distinct lender attempts if permitted.|
|Application → Offer|1 : many|Lender may return one or more offers.|
|Application → Sanction|1 : 0..1 or many versions|Lender product determines revisions; preserve<br>versions, do not overwrite original sanction.|
|Sanction → Facility|1 : 0..many|A term loan may have no reusable facility; facility<br>exists only if lender product provides it.|
|Facility → Drawdown|1 : many|Only multi-drawdown products.|
|Drawdown → Disbursement|1 : 0..many|A drawdown may be paid in part or have<br>reversal/return events.|
|Disbursement → Hospital Receipt|1 : 0..many|One disbursement may have<br>confirmations/mismatch/reconciliation events.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  32 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Relationship**|**Cardinality**|**Rule**|
|---|---|---|
|Financing Case → CaseParty|1 : many|Patient, borrower and other authorised<br>participants are separate roles.|
|Borrower → Expense Entry|1 : many|Optional user-owned personal journal only; not<br>visible to LSP or hospital.|



### **10.4 Physical data design requirements** 

- Use generated surrogate primary keys; never use mobile number, PAN, Aadhaar, FRID or hospital MRN as database primary key. 

- External identifiers are stored with partner namespace and unique constraint (for example lender_id + external_ref). 

- Store money as integer minor units/decimal with currency; do not use floating point. Store requested, approved, disbursed and received amounts separately. 

- Store timestamps in UTC with original timezone/offset where required for display/audit; store event source timestamp and receive timestamp separately. 

- Version lender product configuration, field schema, disclosure template, matching logic, status mapping and notification template. 

- Use soft-delete/deactivation for operational masters where audit/history requires; use retention/deletion workflow for personal data according to law/contract. 

- Encrypt restricted fields and document objects; tokenise/mask identifiers in UI and logs. 

- Separate transaction tables from reporting aggregates; analytics must not expose unnecessary borrower data. 

- Avoid replicating entire lender loan ledger unless lender agreement/API requires it; store snapshots with source and freshness timestamp. 

- Use append-only event history for consent, disbursement, reversal, permission change and critical status transition. 

## **11. Integration, APIs and event contracts** 

### **11.1 Integration principles** 

- The LSP platform integrates with regulated lenders only through approved contracts and channels. Integration method may be API, secure file exchange or controlled manual portal workflow. 

- No hospital HMS/HIS/ERP/billing integration is part of this scope. Hospital portal and executive-entered workflow are independent. 

- Lender adapters are isolated by lender and product; each adapter maps raw external status into a versioned internal status model. 

- All financial actions use idempotency keys and external references. A retry must not create a second application, drawdown or disbursement. 

- Webhooks are authenticated, signed, replay-protected and processed asynchronously. 

- No integration secrets or personal data are written to application logs. 

- A manual fallback must be recorded as a controlled operational event, not an untraceable side process. 

### **11.2 Integration catalogue** 

|**Integration**|**Purpose**|**Data direction**|**Dependency / control**|
|---|---|---|---|
|NBFC / Bank API|Product discovery, application<br>submission/status, offers, KFS/doc<br>refs, sanction, drawdown,<br>disbursement and loan status.|Bidirectional|Lender API contract, security,<br>certification, SLA, consent and field<br>mapping.|
|Lender secure file exchange|Alternative to API where lender<br>supports batch/secure file.|Bidirectional|Encryption, file schema,<br>acknowledgement, duplicate<br>detection and reconciliation.|
|Lender operations portal|Manual fallback / exception<br>handling.|Human-mediated|Approved users; evidence and<br>double check; no password sharing.|
|SMS / email OTP provider|Invitation, verification, status<br>notices and secure links.|Outbound / inbound OTP|Data processor agreement,<br>templates, delivery tracking, sender<br>registration, retention.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  33 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Integration**|**Purpose**|**Data direction**|**Dependency / control**|
|---|---|---|---|
|Push notification provider|Native app status alerts.|Outbound|No sensitive content in notification<br>payload; user preference and<br>privacy.|
|KYC / identity service|Only when lender-authorised and<br>within approved flow.|Bidirectional|Lender owns/approves provider and<br>legal basis; biometric data not<br>stored by LSP.|
|App stores|Native app distribution and update.|Outbound|Security, signing, privacy manifest,<br>app review and version support.|
|Analytics / crash reporting|Operational analytics and stability.|Outbound|No KYC/loan payloads, no FRID/PII<br>in analytics identifiers; vendor<br>review.|
|Hospital portal users|Demand, status, receipt and issue<br>updates.|Bidirectional within portal|No direct hospital system<br>integration; organisation/branch<br>scope.|



### **11.3 Conceptual API resources** 

|**Resource / endpoint concept**|**Purpose**|**Critical behaviour**|
|---|---|---|
|POST /cases|Create a financing case.|Authenticated executive; duplicate check; create<br>CASE_ID and FRID only after required validation.|
|GET /cases/{caseId}|Retrieve case workspace.|Role/scope check; field-level masking.|
|POST /cases/{caseId}/invitations|Issue borrower invite.|Token expiry, one-time use/revocation, delivery<br>record.|
|POST /frid/link|Link borrower account to existing case.|Validate token, intended contact, borrower<br>identity and consent.|
|POST /cases/{caseId}/demands|Create hospital demand.|Hospital scope, amount validation, evidence and<br>verifier.|
|POST /demands/{demandId}/funding-requests|Create request to lender.|Check lender product capability, facility<br>reference and idempotency.|
|POST /applications|Submit lender application.|Borrower-only consent, schema validation,<br>lender idempotency and external reference.|
|GET /applications/{appId}/status|Retrieve current application status.|Source/last-updated timestamp, raw and<br>normalized state.|
|GET /offers/{offerId}|Retrieve lender offer/KFS reference.|Offer version and expiry; no LSP alteration.|
|POST /funding-requests/{id}/borrower-<br>authorisation|Record lender-approved borrower authorisation.|Authentication evidence, amount and purpose<br>bound to exact request.|
|POST /webhooks/{lenderId}|Receive lender callback.|Signature validation, replay protection,<br>idempotent processing.|
|GET /cases/{caseId}/disbursements|List lender-reported disbursement events.|No LSP calculation of authoritative loan balance.|
|POST /disbursements/{id}/hospital-receipts|Record receipt confirmation.|Hospital user access, amount/date/reference<br>and mismatch path.|
|POST /tickets|Create complaint/support request.|Classification, acknowledgement and ownership.|
|GET /borrower/consents|Retrieve borrower consent history.|Only borrower and authorised compliance<br>access.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  34 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

### **11.4 Event catalogue** 

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
|DisbursementEventReceived|Lender|Transaction ledger, hospital notification,<br>reconciliation.|
|HospitalReceiptConfirmed|Hospital portal|Reconciliation and case timeline.|
|DisbursementMismatchRaised|Hospital/ops|Exception queue.|
|ConsentWithdrawn|Borrower|Stop/limit further processing and notify relevant<br>lender.|
|ComplaintCreated|Borrower/hospital/staff|Support and grievance workflow.|



### **11.5 Webhook and idempotency requirements** 

- Verify HMAC/signature or lender-agreed authentication; reject invalid signatures. 

- Validate timestamp, nonce/replay window and partner identity. 

- Persist raw payload in approved protected form or store minimal payload hash/reference if retention policy prohibits full payload. 

- Use lender event ID or a deterministic idempotency key; duplicate event returns prior processing result. 

- Process asynchronously; acknowledge only after durable receipt. 

- Unknown event type goes to dead-letter/exception queue and cannot mutate financial state. 

- Store raw status and normalized status mapping version. 

- Reconcile webhook event with polling/statement where provided by lender. 

- Never infer that transfer is credited solely because an application was approved or sanction issued. 

### **11.6 Manual fallback requirements** 

If a lender has no API or API is unavailable, an authorised executive/operations user may use a lender portal or secure approved file process only under written partner procedure. Record operator, time, lender reference, request payload reference, screenshot/confirmation evidence where legally permitted, second-checker for financial status, and later reconciliation to lender statement/callback. Do not store lender portal passwords in LSP systems or shared documents. 

## **12. Non-functional requirements** 

Targets below are proposed engineering baselines for planning and vendor selection. They are not contractual commitments or proof of regulatory compliance. Confirm capacity, RTO/RPO and performance targets through architecture testing and lender SLAs. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  35 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Quality attribute**|**Requirement / proposed target**|**Verification**|
|---|---|---|---|
|NFR-001|Availability|Target 99.9% monthly availability for<br>core case, borrower link and executive<br>services, excluding planned<br>maintenance and external lender<br>outages.|Monitoring and monthly availability<br>report.|
|NFR-002|Performance|95th percentile page/API response<br>under 2.5 seconds for normal read<br>operations and under 4 seconds for<br>standard writes, excluding external<br>lender calls.|Load test under agreed concurrent-<br>user profile.|
|NFR-003|External dependency latency|External lender calls have explicit<br>timeout, retry, circuit breaker and<br>UNKNOWN state; no UI spinner<br>indefinitely.|Simulated timeout and recovery tests.|
|NFR-004|Mobile performance|Borrower mobile web usable on mid-<br>range Android devices and constrained<br>4G; avoid oversized assets and<br>mandatory app install.|Real-device performance tests.|
|NFR-005|Scalability|Horizontal scale for stateless<br>API/workers; isolate lender connector<br>load from main case service.|Load and soak test at agreed volume<br>plus headroom.|
|NFR-006|Security in transit|TLS 1.2+ (prefer TLS 1.3 where<br>available) for all network connections;<br>secure certificate management.|TLS scan and configuration review.|
|NFR-007|Encryption at rest|Use strong managed encryption for<br>databases, backups and permitted<br>document storage; keys managed<br>separately.|Cloud configuration and key-access<br>audit.|
|NFR-008|Secrets management|No API keys, credentials or signing<br>secrets in source code, client apps or<br>plain config.|Secret scanning and vault audit.|
|NFR-009|Authentication|MFA mandatory for privileged<br>workforce roles; short-lived access<br>tokens; secure refresh and revocation.|Auth penetration and session tests.|
|NFR-010|Authorisation|RBAC + ABAC + field-level masking<br>enforced server-side on every API and<br>export.|Automated cross-tenant and privilege<br>escalation suite.|
|NFR-011|Auditability|Critical events append-only/tamper-<br>evident with actor, action, entity, time,<br>source, reason and correlation ID.|Audit completeness sampling.|
|NFR-012|Privacy / minimisation|Collect only purpose-required<br>information; no broad contacts, call<br>logs, telephony or media access.|Mobile permission audit and data<br>inventory.|
|NFR-013|Data localisation|Where RBI NBFC digital lending<br>requirements apply, lender/LSP data<br>storage/processing controls must<br>meet applicable India localisation and<br>transfer conditions.|Data-flow map, cloud-region evidence,<br>vendor attestations.|
|NFR-014|Retention/deletion|Configurable retention schedules by<br>data class and legal/contract basis;<br>legal hold and deletion evidence.|Scheduled deletion test and audit<br>report.|
|NFR-015|Consent traceability|Consent captured with notice version,<br>purpose, data categories, recipient,<br>timestamp and withdrawal status.|Reconstructable consent audit.|
|NFR-016|Idempotency|All create/submit/payment-status<br>endpoints safe against duplicate<br>requests and repeated webhooks.|Replay and duplicate-submission<br>tests.|
|NFR-017|Resilience|Proposed RPO ≤ 15 minutes and RTO ≤<br>4 hours for core case service, subject<br>to cloud architecture and budget<br>approval.|Disaster recovery exercise.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  36 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Quality attribute**|**Requirement / proposed target**<br>|**Verification**|
|---|---|---|---|
|NFR-018|Backup|Encrypted automated backups; restore<br>test at least quarterly and after<br>material architecture changes.|Successful restore record.|
|NFR-019|Observability|Central metrics, traces and structured<br>logs; correlation IDs across<br>case/lender journeys; PII and secrets<br>redacted.|Redaction and tracing tests.|
|NFR-020|Accessibility|Target WCAG 2.2 AA for core borrower<br>web flows; keyboard/screen-reader<br>support for critical forms.|Automated and manual accessibility<br>audit.|
|NFR-021|Compatibility|Support current and previous two<br>major versions of Android/iOS where<br>native app is released; agreed browser<br>matrix for mobile web.|Device/browser regression suite.|
|NFR-022|Localization|Architecture supports English and<br>additional Indian languages;<br>legal/financial wording must be<br>translated and approved, not machine-<br>translated without review.|Language QA and consistency checks.|
|NFR-023|Maintainability|Domain modules, documented APIs,<br>code review, automated tests,<br>migration scripts and architecture<br>decision records.|Engineering review and maintainability<br>checklist.|
|NFR-024|Secure development|Threat modelling, dependency<br>scanning, SAST/DAST, secrets scan,<br>code review and independent VAPT<br>before production.|Signed security release report.|
|NFR-025|Mobile app security|Certificate pinning where appropriate,<br>jailbreak/root risk assessment, secure<br>local storage, anti-tamper controls and<br>no hard-coded secrets.|Mobile VAPT and OWASP MASVS-<br>aligned review.|
|NFR-026|Document handling|Allowed file types, malware scan, size<br>limits, checksum, access expiry, audit<br>and no public object URLs.|Upload/download security tests.|
|NFR-027|Financial precision|Store monetary values exactly with<br>currency and source; no floating-point<br>amount calculations.|Boundary and reconciliation tests.|
|NFR-028|Time accuracy|Use UTC event timestamps, preserve<br>source timestamps and display local<br>Asia/Kolkata time consistently.|Timezone / DST / clock-skew tests.|
|NFR-029|Vendor portability|Avoid business rules embedded in one<br>cloud/vendor-specific UI or notification<br>provider; connector abstraction for<br>replacements.|Architecture dependency review.|
|NFR-030|Configuration governance|Lender terms, field schema, status<br>mapping and notice text are versioned,<br>approved and effective-dated.|Historical replay/reconstruction test.|
|NFR-031|Data quality|Required reference fields, referential<br>integrity, duplicate controls and<br>reconciliation exceptions.|Data quality dashboard and daily<br>exception review.|
|NFR-032|Notification privacy|Default lock-screen/SMS content<br>avoids sensitive medical, financial or<br>identity details.|Template security review.|
|NFR-033|Human factors|Critical actions clearly distinguish<br>request, approval, disbursement and<br>receipt; no ambiguous green<br>“success” until source confirms.|Usability test with staff and borrowers.|
|NFR-034|API versioning|Version public/partner APIs; backward<br>compatibility and deprecation notice<br>agreed with partners.|Contract tests across versions.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  37 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Quality attribute**|**Requirement / proposed target**|**Verification**|
|---|---|---|---|
|NFR-035|Operational supportability|Admin tools expose actionable error<br>codes, timestamps, correlation IDs<br>and safe retry controls.|Support scenario simulation.|
|NFR-036|Data export control|Exports are minimised, scoped,<br>watermarked where appropriate, time-<br>limited and logged.|Export permission and audit test.|



## **13. Security, privacy and regulatory control framework** 

_Regulatory implementation must be validated against the entity type, lender contracts, actual LSP activities and legal advice. This is a productcontrol baseline, not legal advice._ 

### **13.1 RBI digital lending / NBFC-LSP baseline** 

|**Control area**<br>LSP contractual arrangement|**Product implication**<br>Every digital lending relationship must be<br>governed by a written NBFC-LSP agreement<br>defining roles, rights and obligations.|**Implementation evidence**<br>Signed agreement, scope, service schedule, data<br>schedule, SLA, audit rights, exit and grievance<br>schedules.|
|---|---|---|
|NBFC due diligence and oversight|NBFC performs enhanced due diligence of LSP<br>capability, privacy/storage, borrower conduct and<br>compliance; LSP conduct is periodically<br>reviewed.|Diligence pack, security reports, policies,<br>training, issue log, periodic review.|
|Lender accountability|Outsourcing does not absolve NBFC of regulatory<br>obligations; NBFC remains responsible for LSP<br>acts/omissions within arrangement.|Clear responsibility matrix, escalation and<br>incident cooperation.|
|Multiple lender arrangement|When LSP has multiple lender agreements, digital<br>view of matching offers and unmatched lender<br>names, consistent documented matching,<br>objective comparative disclosures and KFS link<br>are required.|Versioned matching policy, full offer audit,<br>fairness tests and disclosure screenshots.|
|Creditworthiness|Lender obtains economic profile including at<br>minimum age, occupation and income; credit<br>assessment is lender-controlled.|Lender-owned application fields and decision<br>record; LSP cannot override.|
|Disclosures|Lender provides KFS and digitally signed loan<br>documents/terms/account statements through<br>verified contact as required.|Lender document reference and delivery status;<br>borrower access.|
|Disbursal and repayment|Specific end-use loan may be disbursed directly<br>to end-beneficiary where permitted; LSP must not<br>control fund flow. Borrower repayments go<br>directly to NBFC, without LSP pass-through<br>account.|Funds-flow diagram, bank-account restrictions,<br>lender contract and transaction logs.|
|LSP compensation|LSP fees/charges/reimbursements payable by<br>NBFC are paid directly by NBFC and not<br>separately charged/collected from borrowers.|Commercial contract and borrower payment<br>audit.|
|Cooling-off|Borrower has explicit exit option during lender-set<br>cooling-off period, not less than one day, with<br>proportionate APR treatment; any retained one-<br>time processing fee must be disclosed.|Lender config, KFS content, borrower UI and test.|
|Grievance|NBFC and borrower-facing LSP designate nodal<br>grievance officers; contacts on website/DLA and<br>KFS; lender retains grievance accountability.|Published contacts, complaint form, routing,<br>escalation and reporting.|
|Data collection and consent|Need-based collection, prior explicit consent with<br>audit trail; no access to contacts, call logs,<br>telephony and broad media; one-time access for<br>camera/mic/location only if necessary and<br>specifically consented.|Mobile permission manifest, consent ledger and<br>data map.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  38 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Control area**|**Product implication**|**Implementation evidence**|
|---|---|---|
|Storage restrictions|LSP does not store borrower personal information<br>except basic minimum (e.g. name, address,<br>contact) required within agreement; lender<br>responsible for ongoing privacy/security.|Data inventory, field-level ownership, retention<br>schedule, vendor controls and storage approval.|
|Localisation|NBFC ensures data stored only on servers in<br>India; if processed outside India, deleted offshore<br>and brought back within prescribed 24-hour<br>condition.|Cloud region configuration, vendor/subprocessor<br>register and data-flow assessment.|
|DLA reporting|NBFC reporting of LSP-operated DLA to RBI/CIMS<br>as required.|Partner confirms DLA listing and reporting<br>responsibility; maintain exact app/web<br>identifiers.|
|Recovery|LSP must not engage in recovery unless<br>separately authorised, contractually scoped,<br>trained and compliant.|Default state: no collections/recovery by LSP; any<br>future scope requires legal and lender sign-off.|



### **13.2 Direct hospital disbursement — design gate** 

RBI’s NBFC Digital Lending chapter permits disbursement for a specific end-use directly into the bank account of the endbeneficiary, subject to the applicable framework. A hospital payment may be structured as specific end-use, but this is not a blanket permission for every product or every hospital arrangement. The lender must approve the credit product, beneficiary validation, purpose evidence, disbursement process and funds-flow design. LSP must not have direct or indirect control over funds. 

**LEGAL / LENDER GATE** Do not build a payment instruction or display “funds sent to hospital” until the lender confirms this loan is a specific end-use product and the named hospital account is an approved end-beneficiary. LSP must never route the amount through its own account. [R1] 

### **13.3 Data ownership, classification and storage policy** 

|**Data class**|**Examples**|**Default LSP handling**|**Access**|
|---|---|---|---|
|Public|Website pages, public lender<br>grievance contacts.|Publish approved content.|Public.|
|Internal|Employee IDs, assignment queues,<br>non-sensitive operational notes.|Store in protected systems;<br>retention by policy.|Workforce by role.|
|Confidential business|Hospital commercial terms, lender<br>integration config, partner contracts.|Encrypt, restrict exports, no public<br>links.|Authorised admin/ops/compliance.|
|Restricted personal|Name, address, contact, case<br>identifiers.|Collect minimum required; LSP<br>storage only where NBFC agreement<br>permits.|Assigned executive/ops and<br>borrower own record.|
|Restricted financial/KYC|PAN/Aadhaar, income, bank<br>statements, credit bureau, KYC<br>images.|Prefer direct lender<br>capture/handoff. Do not store in LSP<br>database/document vault unless<br>lender/legal approves a specific<br>permitted processing arrangement.|Lender; minimal LSP support view<br>where expressly permitted.|
|Restricted health-related|Diagnosis, clinical report, treatment<br>notes, prescription, lab data.|Do not collect for LSP financing<br>workflow unless necessary,<br>specifically approved and lawful.<br>Prefer hospital billing evidence only.|No general LSP staff access.|
|Personal expense journal|Borrower-entered<br>amount/category/note.|OFF by default; legal-gated. If<br>approved, isolated from<br>case/lender/hospital data; no<br>sharing by default.|Borrower only.|
|Secrets/authentication|OTP, password, PIN, API secret,<br>private key.|Never store or log borrower<br>OTP/PIN/password. Partner secrets<br>in managed vault.|Secret system only.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  39 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

### **13.4 Consent model** 

- Provide a standalone privacy notice that is understandable without reading other documents. 

- Separate consent purposes: account creation, case linking, lender application/data sharing, optional marketing, optional analytics and any optional app feature. 

- Record notice/consent version, data types, purpose, named recipients/categories, channel, affirmative action, time and withdrawal event. 

- Consent withdrawal must be as easy as giving consent where law requires; it stops future optional processing but does not erase legally required lender records. 

- Do not use a blanket “agree to everything” checkbox for unrelated optional purposes. 

- Explain which data is processed by LSP, which is sent to the NBFC, which is collected directly by lender/KYC provider, and which data is visible to hospital. 

- Do not condition loan application on optional marketing or expense tracking. 

### **13.5 DPDP transition calendar — checked 9 November 2026** 

|**Date**|**Commencement identified in Gazette**|**Product action**|
|---|---|---|
|13 Nov 2025|Selected DPDP Act provisions and DPDP Rules 1,<br>2, 17–21 commenced.|Maintain legal register and foundational<br>governance; confirm current obligations with<br>counsel.|
|13 Nov 2026|DPDP Act section 6(9) and section 27(1)(d); DPDP<br>Rule 4 (Consent Manager registration/duties)<br>scheduled to commence.|Recheck status and applicability on/after 13 Nov<br>2026; do not assume product is a registered<br>Consent Manager.|
|13 May 2027|Major remaining DPDP Act provisions (including<br>sections 3–17, 27 except 27(1)(d), 28–34, 36, 37<br>and 44(2)) and DPDP Rules 3, 5–16, 22–23<br>scheduled to commence.|Design notice, consent, security, rights, breach<br>and retention workflows for effective date;<br>confirm any subsequent government<br>amendment.|



_Dates above are calculated from the official commencement notifications published 13 November 2025. Because the implementation timeline is phased and future government amendments may occur, Legal/Compliance must re-check the Gazette before production release. [R3, R4]_ 

### **13.6 Additional legal / compliance areas to assess** 

- RBI KYC Directions applicable to NBFC; lender retains KYC ownership and required controls. 

- RBI Responsible Business Conduct Directions and KFS / APR disclosure framework. 

- RBI Managing Risks in Outsourcing Directions, including lender oversight, audit, confidentiality, continuity, exit, subcontracting and cloud risk. 

- Information Technology Act, 2000 and rules relevant to electronic records, signatures, security practices and intermediary/service roles as applicable. 

- Digital Personal Data Protection Act and Rules commencement schedule, plus any sector-specific privacy obligations. 

- Consumer Protection Act and CCPA Dark Patterns Guidelines; fair presentation, no misleading “guaranteed approval” claims and no manipulative lender ranking. 

- Telecom commercial communications / DLT requirements for transactional SMS and marketing messages. 

- CERT-In directions and applicable cybersecurity incident/logging/reporting obligations; confirm scope and timelines with counsel. 

- State-specific Shops & Establishments/employment rules, hospital premises access and health facility contracts. 

- Payment aggregator / payment system regulatory perimeter: avoid collecting or routing loan instalments or disbursement funds; legal review before any payment feature. 

- Insurance Intermediary perimeter: do not solicit, advise, adjudicate or settle insurance claims unless separately licensed/authorised. 

### **13.7 Required legal/compliance documents before production** 

- LSP legal-entity and activity classification memo. 

- Executed NBFC/bank LSP agreement for every lender. 

- Lender-approved product, pricing, KFS, borrower journey and funds-flow documents. 

- Hospital referral / premises / data-sharing / beneficiary verification agreement. 

- Privacy policy, borrower notices, terms of use and data-processing schedule. 

- Subprocessor/vendor agreements, security schedule and data location statement. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  40 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

- Grievance redressal policy, nodal officer details and escalation path. 

- Retention and deletion schedule, legal hold procedure and data subject request workflow. 

- Incident response, breach management and business continuity plans. 

- Staff code of conduct, training, customer communication scripts and monitoring plan. 

- DLA identification/reporting responsibility confirmation for app and web domains. 

- VAPT/security audit and remediation evidence accepted by lender. 

## **14. Operating procedures, controls and team handbook** 

### **14.1 Hospital onboarding SOP** 

**1.** Identify hospital legal entity and branch; verify registration and operating authority through approved evidence. 

**2.** Agree referral/desk arrangement and permitted marketing claims. 

**3.** Identify hospital sponsor, billing/finance verifier, hospital admin and escalation contact. 

**4.** Verify beneficiary account through independent documentation and out-of-band callback; two-person approval for changes. 

**5.** Define accepted demand evidence and who can certify it. 

**6.** Set hospital user list, branch scope and user training. 

**7.** Define disbursement confirmation process and reconciliation contacts. 

**8.** Execute agreement covering data access, confidentiality, premises, referrals, no credit decision, no borrower fee collection, incident notification and exit. 

**9.** Activate hospital only after compliance and operations sign-off. 

**10.** Review hospital staff access periodically; suspend promptly when staff leaves or agreement ends. 

### **14.2 Executive desk SOP — start of shift** 

**1.** Login with individual account and MFA; verify assigned hospital/branch. 

**2.** Check open tasks, pending borrower actions, lender outages, unresolved disbursement mismatches and hospital contact changes. 

**3.** Confirm approved lender product/disclosure version is active. 

**4.** Ensure desk signage/QR is current and points to official domain/app store. 

**5.** Never use personal WhatsApp/email for KYC/loan documents unless expressly approved by policy; use platform channel. 

**6.** Do not promise sanction, interest rate, claim approval, or disbursement time. 

### **14.3 Executive desk SOP — each borrower** 

**1.** Explain role: LSP facilitates; NBFC makes lending decision and is creditor. 

**2.** Identify patient and proposed borrower separately. 

**3.** Confirm hospital and branch; capture demand amount and deadline from approved source. 

**4.** Explain consent and data-use notice before collecting personal information. 

**5.** Create case and FRID; verify phone/email intended for borrower. 

**6.** Send secure invitation; borrower personally links and submits own declarations. 

**7.** If borrower needs help, explain fields in neutral language; do not choose answers or enter secret OTP/PIN. 

**8.** Track status and tell borrower who currently needs to act (borrower, lender, hospital or LSP). 

**9.** Capture later demand as new DEMAND_ID and ensure current lender product supports additional utilisation before representing any availability. 

**10.** Close shift tasks and report unusual pressure, suspected fraud, complaint or privacy issue. 

### **14.4 Hospital staff SOP** 

**1.** Refer customer without promising financing outcome. 

**2.** Only authorised finance users submit or verify demand details. 

**3.** Confirm amount, purpose, due time and beneficiary against hospital record. 

**4.** Do not ask LSP executive to collect patient cash or repay loan on hospital’s behalf. 

**5.** Use hospital portal only for hospital-owned data and authorised case status. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  41 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

**6.** Confirm receipt only after checking hospital bank/finance record; raise mismatch otherwise. 

**7.** Escalate bank account change requests and suspected identity manipulation. 

### **14.5 Operations manager daily control checklist** 

|**Control**|**Daily check**|**Evidence**|
|---|---|---|
|Case integrity|Check cases with missing patient/borrower role,<br>invalid FRID, duplicate match or incomplete<br>demand evidence.|Exception queue and resolution owner.|
|Borrower action|Review invitations sent but not linked, abandoned<br>applications and pending borrower action.|Ageing report and contact log.|
|Lender status|Review pending/unknown lender status,<br>duplicate submissions and webhook failures.|Lender connector dashboard.|
|Disbursement|Review<br>initiated/processing/unknown/failed/returned/rev<br>ersed records and hospital receipt mismatches.|Transaction reconciliation report.|
|Beneficiary|Review changes and pending verification.|Maker-checker approval and callback record.|
|Access|Review terminated employees, failed logins,<br>unusual exports and cross-tenant denied<br>attempts.|IAM and audit report.|
|Complaints|Review open complaints, ownership, ageing and<br>lender escalations.|Complaint dashboard.|
|Partner SLA|Review lender/hospital turnaround and outage<br>notices.|Partner scorecard.|
|Data/security|Review privacy requests, document access,<br>incident and vendor alerts.|Compliance queue.|



### **14.6 Maker-checker policy** 

|**Action**|**Maker**|**Checker**|**Reason**|
|---|---|---|---|
|Hospital bank account add/change|Hospital admin / LSP operations<br>capture|Independent LSP<br>finance/compliance verifier|Prevents beneficiary redirection<br>fraud.|
|Privileged role grant|Platform admin|Second authorised admin / security<br>owner|Prevents privilege escalation.|
|Manual disbursement status<br>correction|Operations user enters evidence|Independent operations manager|Prevents false payment<br>confirmation.|
|Manual lender application<br>submission fallback|Executive/operations operator|Second authorised operator if<br>duplicate/financial impact risk|Prevents duplicate or inaccurate<br>submission.|
|Data export with restricted data|Authorised requester|Compliance/data owner|Prevents excessive disclosure.|
|Case merge / identity correction|Operations user proposes|Operations manager/compliance as<br>needed|Preserves identity and audit<br>integrity.|
|Refund / reversal status entry|Operations records lender evidence|Independent checker|LSP does not initiate/refund funds.|



### **14.7 Staff conduct and prohibited behaviour** 

- Never guarantee loan approval, APR, sanction time or insurance claim outcome. 

- Never ask borrower to share OTP, password, app PIN, card PIN or lender login. 

- Never submit a false income, occupation, relationship, demand amount or document on borrower’s behalf. 

- Never rank lenders based on undisclosed commission or pressure borrower to choose a lender. 

- Never access cases outside assignment/scope “out of curiosity”. 

- Never download or store borrower KYC/medical files on personal devices or chat groups. 

- Never accept cash, fees, gifts or commission from borrower for LSP service. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  42 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

- Never modify beneficiary account or payment instructions from an informal message. 

- Never describe a pending/unknown transaction as paid. 

- Report suspected fraud, coercion, privacy incident, unauthorised access or mis-selling immediately. 

## **15. Financial transaction, tranche and reconciliation model** 

### **15.1 Keep four financial views separate** 

|**View**|**Owner / source of truth**|**What LSP records**|**What LSP must not do**|
|---|---|---|---|
|Hospital billing|Hospital|Demand evidence, demand<br>amount/status and limited final<br>confirmation if agreed.|Calculate hospital final bill, allocate<br>deposits or settle hospital ledger.|
|Lender loan account|NBFC/bank|External account reference, lender-<br>reported status, lender statements<br>and transaction refs.|Set APR, calculate authoritative<br>interest, alter EMI or present local<br>balance as official.|
|LSP service workflow|LSP|Case, application status, demand<br>workflow, tasks, event history and<br>exceptions.|Represent as official hospital or<br>lender book of record.|
|Personal/family funding|Borrower/family|Nothing about family contributions.<br>Optional user-owned expense notes<br>only if approved.|Collect, classify, split, allocate,<br>reconcile or report family<br>contribution.|



### **15.2 Demand-to-funding-to-payment chain** 



<!-- Start of picture text -->
Ve Do not collapse these records into one status<br>[Eobiano"io™Hospital demand >/ runoineFundingRequest request J >|“(coma)Borrowerwmerrequred annonsio)authorisationJ > LenderTENDER decision drawdownREF DISBURSENENTIDDisbursementevent }| _, (“HospiRECEPT.IDecip contrmaton }<br><!-- End of picture text -->

### **15.3 Multi-tranche loan product — required distinctions** 

The LSP should support the concept of repeated hospital payment demands, but loan facility and drawdown mechanics are external product terms. Do not assume a revolving credit line or automatic re-use of a sanctioned limit. The lender must specify whether product is a one-time term loan, progressive/multiple disbursement term loan, committed facility with drawdowns, top-up loan or separate applications. 

|**Concept**|**Meaning**|**Owner**|
|---|---|---|
|Sanction|Lender’s approval and conditions. May specify a<br>single disbursement or an eligible structure.|Lender.|
|Facility / limit|Approved ceiling available for utilisation, if lender<br>product defines one.|Lender.|
|Hospital demand|Amount the hospital says is currently payable.|Hospital; captured by LSP.|
|Funding request|Borrower/LSP request to finance an eligible<br>demand.|LSP workflow + borrower authorisation.|
|Drawdown|Lender-approved utilisation under facility, if<br>product supports it.|Lender.|
|Disbursement|Actual transfer to approved beneficiary.|Lender.|
|Interest accrual|Calculated under lender agreement from<br>applicable date and principal basis.|Lender.|
|Capitalisation / compounding|If and how accrued interest is added to principal;<br>only as loan contract allows.|Lender.|
|EMI / repayment schedule|Lender-calculated payment obligation based on<br>actual product rules.|Lender.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  43 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Concept**|**Meaning**|**Owner**|
|---|---|---|
|Hospital receipt|Hospital confirmation that funds were credited.|Hospital.|



### **15.4 Questions that must be answered per lender product** 

- Is a single sanction valid for multiple drawdowns? 

- Is each drawdown a new loan account, a sub-account, a separate tranche or a utilisation under one facility? 

- Does interest accrue only on disbursed principal or on sanctioned amount? 

- What is the exact day-count basis, rate type, compounding/capitalisation treatment and value date? 

- When does EMI/repayment start: first drawdown, last drawdown, fixed date or another rule? 

- Does each drawdown change EMI, tenure, amortisation schedule, or create a separate repayment stream? 

- How is unused sanctioned amount treated and when does sanction/facility expire? 

- Can borrower cancel an undrawn amount? Are there cancellation or processing charges? 

- Can partial disbursement occur? How are failed, returned and reversed transfers handled? 

- Can a later hospital demand be funded without a new credit assessment or loan agreement? 

- How are excess payment and hospital refund handled? Does refund reduce principal and who initiates the adjustment? 

- Can multiple lenders fund different demands under one episode? What conflicts/duplicate financing checks are required? 

### **15.5 Interest and repayment display** 

**SOURCE-OF-TRUTH RULE** The LSP must not calculate or compound interest as an authoritative customer balance. Display lenderissued statements, APR, repayment schedule and current balance with source and last-updated time. If lender data is stale/unavailable, show “last updated” and direct borrower to lender statement/contact. 

### **15.6 Reconciliation layers** 

|**Reconciliation**|**Comparison**|**Owner**|**Exception examples**|
|---|---|---|---|
|Application|LSP APP_ID ↔ lender application<br>reference/status.|LSP + lender|Submission accepted but callback<br>missing; duplicate application.|
|Funding request|DEMAND_ID ↔<br>FUNDING_REQUEST_ID ↔ lender<br>facility/drawdown reference.|LSP + lender|Demand amount changed; facility<br>unsupported; borrower<br>authorisation missing.|
|Disbursement|Lender disbursement<br>feed/statement ↔ LSP transaction<br>event.|Lender owns; LSP monitors|Amount mismatch; duplicate event;<br>return/reversal; unknown transfer.|
|Hospital receipt|Lender confirmed disbursement ↔<br>hospital bank receipt confirmation.|Hospital + lender; LSP coordinates|Lender says success, hospital<br>cannot identify credit.|
|Hospital billing|Hospital final ledger ↔ hospital own<br>interim/advance/final demand<br>records.|Hospital only|Advance adjustment or bill<br>correction; LSP does not reconcile<br>this.|
|Loan account|Lender statement ↔ app displayed<br>snapshot.|Lender owns; LSP checks feed<br>consistency|Stale balance, missing statement or<br>schedule mismatch.|



## **16. Reporting, dashboards and product analytics** 

### **16.1 Executive / operations metrics** 

|**Metric**|**Definition**|**Breakdowns**|
|---|---|---|
|Cases created|Count of active cases created in period, excluding<br>test/duplicate cases.|Hospital, branch, executive, channel, date.|
|FRID link conversion|Linked borrower cases ÷ FRID issued cases.|Hospital, executive, channel.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  44 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Metric**|**Definition**|**Breakdowns**|
|---|---|---|
|Application start/completion|Applications started/submitted ÷ linked cases.|Lender, product, borrower channel.|
|Lender decision turnaround|Time from complete lender submission to lender<br>decision; exclude periods only if explicitly<br>defined.|Lender/product/amount band.|
|Sanction conversion|Sanctioned applications ÷ applications with final<br>decision.|Lender/product/channel.|
|Disbursement conversion|Cases with lender-confirmed disbursement ÷<br>cases with submitted applications.|Lender/hospital/branch.|
|Time to hospital credit|Time from lender initiation/confirmation to<br>hospital receipt confirmation; show both<br>measures separately.|Lender, bank, hospital.|
|Demand response time|Time from demand created to verified.|Hospital/branch/demand type.|
|Additional request outcomes|Funding requests approved, declined, pending,<br>unsupported and cancelled.|Lender/product/demand type.|
|Unknown transaction ageing|Count and amount of unknown/pending-<br>confirmation disbursements.|Lender/hospital/age.|
|Complaint rate and resolution|Complaints per case/borrower and time to<br>resolve.|Category, lender, hospital, severity.|
|Executive productivity|Cases managed, borrower links, complete<br>submissions and service quality.|Executive/branch; quality guardrails.|
|Duplicate/fraud indicators|Potential duplicate, suspicious link attempts,<br>beneficiary change and confirmed fraud.|Risk type/partner.|
|System reliability|API uptime, error rate, queue latency and<br>notification delivery.|Service/lender/provider.|



### **16.2 Hospital dashboard metrics** 

- Cases referred by own branch and current status. 

- Demands submitted, awaiting verification, funding requested and resolved. 

- Lender-confirmed disbursements and receipt confirmations. 

- Payment mismatches and ageing. 

- Average time between demand submission and lender decision/disbursement (clearly labelled). 

- Hospital portal user activity and unresolved support tickets. 

Hospital reports must not expose personal expense journal entries, income, credit bureau data, KYC documents, borrower loan accounts outside hospital-related finance, or family contributions. 

### **16.3 Borrower dashboard** 

- Linked cases and role (patient / borrower / co-applicant). 

- Application stage, pending borrower action and last updated time. 

- Lender offers and KFS if applicable. 

- Lender-confirmed disbursement timeline and hospital receipt status if shared. 

- Lender-reported loan account, statement and repayment details where feed exists. 

- Complaint and support status. 

- Optional personal expense journal only if approved and separate. 

### **16.4 Analytics event taxonomy** 

Use event names with actor, entity, channel, source, timestamp, correlation ID and configuration version. Do not put PAN, Aadhaar, full phone, name, free-text clinical content, KFS personal data or FRID tokens into analytics payloads. Example events: case_created, frid_issued, invitation_opened, borrower_linked, application_started, application_submitted, lender_status_received, offer_viewed, offer_selected, demand_created, funding_request_authorised, drawdown_decided, disbursement_confirmed, hospital_receipt_confirmed, complaint_created. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  45 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

## **17. Support, complaints, incidents and continuity** 

### **17.1 Complaint categories** 

|**Category**|**Responsible party (typical)**|**LSP action**|
|---|---|---|
|LSP staff conduct / mis-selling|LSP|Acknowledge, investigate, preserve records,<br>remediate and notify lender as required.|
|Application submission / technical issue|LSP and lender|Trace correlation ID; identify payload/response;<br>avoid duplicate submission.|
|Credit decision / loan terms / APR|Lender|Route to lender grievance; LSP must not change<br>decision or defend undisclosed terms.|
|KFS / agreement / repayment / balance|Lender|Route to lender; preserve document delivery<br>evidence.|
|Hospital demand / bill amount|Hospital|Route to hospital finance; LSP does not correct<br>hospital ledger.|
|Disbursement missing / wrong beneficiary|Lender and hospital; LSP coordinates|Open high-priority mismatch; freeze further<br>requests if fraud risk; reconcile source evidence.|
|Privacy / unauthorised access|LSP and lender depending on data/control|Incident response, containment, evidence<br>preservation and regulatory/contractual<br>notification assessment.|
|App account / FRID linking|LSP|Secure identity check, revoke invite/session if<br>needed and assist relinking.|



### **17.2 Complaint workflow** 

**1.** Create ticket with unique ID, date/time, complainant, channel, case reference, complaint type, responsible party and desired resolution. 

**2.** Acknowledge using approved template and explain whether issue is owned by LSP, lender or hospital. 

**3.** Route lender-related digital lending complaint to lender nodal grievance officer; LSP maintains own nodal contact for its interface. 

**4.** Track acknowledgement, owner, first response, resolution and borrower satisfaction/appeal. 

**5.** Escalate based on lender’s policy and applicable regulatory timelines; include RBI CMS route wording only as legal-approved. 

**6.** Keep audit evidence and do not close a complaint solely because it has been forwarded. 

### **17.3 Security / privacy incident response** 

|**Phase**|**Required action**|
|---|---|
|Detect|Alert from system, employee, lender, hospital, borrower or vendor; record<br>incident ID and discovery time.|
|Contain|Suspend compromised account/token/integration; isolate affected service;<br>stop risky processing.|
|Assess|Identify data, systems, borrowers, partner, scope, duration, access,<br>exfiltration and possible harm.|
|Notify|Apply statutory, CERT-In, RBI/lender contract and DPDP notification<br>obligations as applicable; legal decides scope and timing.|
|Remediate|Patch, rotate secrets, restore, block vector and correct access policy.|
|Communicate|Use approved borrower/partner communications; avoid speculation.|
|Learn|Root-cause analysis, control improvement, vendor review, training and<br>post-incident sign-off.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  46 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

### **17.4 Business continuity and disaster recovery** 

- Maintain contact tree for lender, hospital and cloud/vendor escalations. 

- If platform unavailable, executives use approved continuity form with minimum data; sensitive documents are not moved to personal devices. 

- When service resumes, back-enter records with original event time, capture operator and mark as continuity entry. 

- Lender portal outages are not treated as LSP system success; show external dependency delay. 

- Test restoration, data integrity and notification replay. 

- Have exit/portability procedure for each lender connector and key vendor. 

## **18. Risk register and control catalogue** 

|**Risk ID**<br>R-01|**Risk**<br>Regulatory perimeter /<br>unauthorised activity|**Rating**<br>High|**Exposure**<br>Legal classification of<br>LSP, app, hospital<br>workflow and optional<br>services.|**Primary control**<br>Legal opinion, lender<br>contracting, scope<br>controls, no funds or<br>credit decisions by LSP.|**Owner**<br>Legal/Compliance|
|---|---|---|---|---|---|
|R-02|Lender does not support<br>multi-drawdown product|High|Hospital payment stages<br>may not map to one loan<br>facility.|Lender product<br>validation; adapter<br>config; fallback path<br>clearly identified as new<br>application/top-up or<br>unsupported.|Product + Partnerships|
|R-03|Interest / EMI confusion|High|Borrower<br>misunderstands accrual<br>after multiple<br>utilisations.|Lender-sourced<br>KFS/schedule; product-<br>specific explanation; no<br>LSP-calculated amount.|Lender + Product|
|R-04|Borrower identity fraud /<br>FRID takeover|High|FRID or link<br>shared/guessed.|Unguessable ID, one-<br>time token, verified<br>contact, rate limit,<br>revocation, audit.|Security|
|R-05|Executive mis-selling /<br>coercion|High|Emergency context and<br>information imbalance.|Script, training, call<br>sampling, complaints,<br>no guaranteed approval,<br>neutral offers.|Operations +<br>Compliance|
|R-06|Hospital beneficiary<br>redirection|Critical|Fraudulent bank account<br>change.|Independent bank<br>verification, maker-<br>checker, cooling hold,<br>audit, lender<br>revalidation.|Hospital Ops + Security|
|R-07|Lender webhook/status<br>mismatch|High|Unknown or duplicate<br>event.|Idempotency, raw event<br>retention under policy,<br>status enquiry, exception<br>queue.|Engineering|
|R-08|Disbursement marked<br>paid without receipt|High|Lender event and<br>hospital bank credit<br>differ.|Separate lender<br>confirmation and<br>hospital receipt; no<br>inferred receipt.|Operations|
|R-09|Over-collection of<br>KYC/health data|Critical|LSP stores documents<br>outside permitted scope.|Data inventory, no<br>document vault by<br>default, direct lender<br>capture, retention<br>controls.|Privacy/Compliance|
|R-10|Unauthorised access<br>across hospital tenants|Critical|Hospital user sees<br>another hospital or<br>borrower sensitive data.|ABAC, field masking,<br>automated cross-tenant<br>tests, review.|Security/Engineering|
|R-11|Family contribution<br>enters platform scope|Medium|Pressure to reconcile<br>patient/family money.|Explicit exclusion, no<br>fields, no operational<br>reports, training.|Product|
|R-12|App adoption friction|Medium|Installation delays<br>borrower during<br>emergency.|Mobile web first-class<br>parity; native app<br>optional, secure deep<br>link.|Product|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  47 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Risk ID**|**Risk**|**Rating**|**Exposure**|**Primary control**|**Owner**|
|---|---|---|---|---|---|
|R-13|Manual operation error|High|No HMS integration<br>means repeated entry.|Validation, dual checks,<br>structured templates,<br>duplicate detection and<br>QC.|Operations|
|R-14|Lender concentration|High|Single lender<br>outage/product policy<br>change.|Multi-lender only with<br>agreements and fair<br>matching; contingency<br>planning.|Partnerships|
|R-15|Lender API dependency<br>outage|High|Application/<br>disbursement status<br>unavailable.|Circuit breaker, fallback,<br>UNKNOWN state and<br>transparent timestamps.|Engineering|
|R-16|Hospital bypasses<br>platform|Medium|Direct lender partnership<br>displaces LSP.|Workflow service value,<br>service quality, partner<br>agreements, no artificial<br>lock-in.|Business|
|R-17|Expense journal violates<br>data constraints|High|App stores data not<br>allowed by<br>RBI/lender/privacy<br>policy.|Feature off until legal<br>approval; local-only is<br>not assumed exempt;<br>strict separation.|Legal/Product|
|R-18|Poor economics / low<br>sanction rate|High|High demand but low<br>lender approval or high<br>service cost.|Track unit economics<br>and segment<br>performance; avoid<br>volume-only growth.|Business|
|R-19|Borrower complaint<br>mishandling|High|Unclear LSP/NBFC<br>accountability.|Published nodal<br>contacts, routing,<br>complaint ageing and<br>escalation audit.|Compliance|
|R-20|Vendor / cloud security<br>failure|Critical|Sensitive data exposure<br>or downtime.|Due diligence,<br>subprocessor register,<br>access limits, VAPT,<br>incident and exit plans.|Security/Compliance|



## **19. Quality assurance and end-to-end release acceptance** 

### **19.1 Test layers** 

- Unit tests: validation, ID generation, permission policy, status mapping, money precision and state transition rules. 

- API/contract tests: lender schemas, webhook signatures, idempotency, timeouts, version compatibility and manual fallback. 

- Integration tests: application create/update, offers, KFS, sanction, drawdown, disbursement and hospital receipt. 

- Security tests: unauthorised access, cross-tenant access, IDOR, privilege escalation, FRID guessing, session hijack, secret leakage and mobile reverse engineering. 

- Privacy tests: data minimisation, consent, deletion/withdrawal, no prohibited mobile permissions, log redaction and retention. 

- Usability tests: stressed borrower, low bandwidth, mid-range Android, screen reader and staff workflow. 

- Operational tests: mismatch, decline, unknown, return, complaint, outage and end-of-shift reconciliation. 

- Disaster recovery: database restore, key rotation, queue replay and lender connector failover. 

### **19.2 End-to-end acceptance scenarios** 

|**Test ID**|**Scenario**|**Pass condition**|
|---|---|---|
|AT-01|Executive creates valid case|Valid hospital/branch and patient/borrower create<br>case; CASE_ID and FRID are generated; no HMS call<br>occurs.|
|AT-02|App user without FRID tries to apply|System does not create application; shows guidance<br>to visit desk/obtain executive invitation.|
|AT-03|Valid borrower links FRID|Secure link verifies intended contact; case visible<br>only after successful link and notice/consent.|
|AT-04|FRID guessed or reused|Rate limit/block; no case details disclosed; security<br>event logged.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  48 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Test ID**<br>AT-05|**Scenario**<br>Patient differs from borrower|**Pass condition**<br>Separate party identities and permissions; patient<br>does not see borrower financial info by default.|
|---|---|---|
|AT-06|Borrower declines consent|Application sharing stops; system records decline<br>and does not submit to lender.|
|AT-07|Lender API timeout after submit|Application state becomes pending/unknown;<br>idempotent status check prevents duplicate<br>submission.|
|AT-08|Multiple lender offers|All matching offers and unmatched lenders displayed<br>as required; fair comparison and KFS links available.|
|AT-09|Lender rejects application|Case reflects lender-provided decline; no user can<br>manually change decision.|
|AT-10|Lender sanctions single-disbursement product|System does not permit later tranche as if facility<br>exists; directs to lender-approved new application<br>route.|
|AT-11|Lender supports multiple drawdowns|Funding request bound to demand, borrower<br>authorises exact request, lender approves and<br>provides drawdown reference.|
|AT-12|Hospital demand changes after authorisation|Original demand/request history preserved; change<br>requires lender-defined amendment/cancellation<br>path.|
|AT-13|Disbursement confirmed but receipt absent|Lender status and hospital receipt remain distinct;<br>mismatch exception opens.|
|AT-14|Disbursement fails/returns|Original record retained; return/reversal event linked;<br>borrower/executive notified appropriately.|
|AT-15|Hospital tries to access another hospital case|Access denied at API; no data leakage; audit event<br>logged.|
|AT-16|Hospital user requests KYC document|Access denied; support does not bypass without<br>formal legal/partner approval.|
|AT-17|Executive tries to enter borrower OTP|Workflow/training prohibits; no OTP field is available<br>to staff; event escalates if attempted.|
|AT-18|Hospital beneficiary account change|Change held pending independent verification and<br>maker-checker approval.|
|AT-19|Borrower installs app after web start|Secure deep link resumes linked case without new<br>case/FRID or exposing token in analytics.|
|AT-20|Borrower uses mobile web only|Full core application journey works without app<br>installation.|
|AT-21|Expense journal feature disabled|No UI/API/storage for journal is available; no personal<br>expense data collected.|
|AT-22|Expense journal approved and enabled|Journal remains borrower-only; not visible to<br>hospital, executive, lender or analytics; deletion and<br>consent work.|
|AT-23|Borrower complaint is lender-related|Ticket routed to correct NBFC grievance channel and<br>tracked; LSP complaint accountability remains.|
|AT-24|Staff deactivated|Sessions/tokens revoked and case history retained;<br>reassignment queue gets tasks.|
|AT-25|Daily reconciliation mismatch|Exception owner assigned; source evidence required;<br>no unauthorised manual correction.|
|AT-26|Consent withdrawal|Future optional sharing stops; partner is notified as<br>required; mandatory records retained per legal basis.|
|AT-27|LSP case closed while loan active|Case service closure does not update lender loan<br>status to closed.|
|AT-28|Concurrent webhook retries|Only one financial event is applied; duplicate event<br>logged as duplicate.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  49 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**Test ID**|**Scenario**|**Pass condition**|
|---|---|---|
|AT-29|Data export requested by executive|Export denied unless permission and approval;<br>sensitive fields masked and export audited.|
|AT-30|Data breach simulation|Incident response opens, systems are contained,<br>owners and notification assessment recorded.|



### **19.3 Production release gates** 

- Signed product scope, role matrix and lender product behaviour approved. 

- NBFC LSP agreement and required due diligence accepted; DLA/web/mobile identification and reporting responsibilities confirmed. 

- Direct beneficiary funds flow signed off by lender and legal counsel. 

- Data map, storage, retention, consent and DPDP transition actions reviewed. 

- All P0 requirements pass; all critical defects closed or formally risk-accepted. 

- RBAC/ABAC and cross-tenant security tests pass. 

- VAPT and security review accepted by LSP and lender as required. 

- Backup/restore and incident response rehearsed. 

- Operational SOP, executive training, hospital training and complaint escalation live. 

- Lender callback/statement reconciliation tested. 

- No hard-coded lender term, rate, drawdown capability or disbursement state. 

- Monitoring dashboards, alert routing and support rota active. 

## **20. Delivery governance, architecture decisions and open decision register** 

### **20.1 Product governance** 

|**Decision type**|**Decision owner**|**Required consultees / evidence**|
|---|---|---|
|Business scope / channel|Founder / Product Owner|Operations, engineering, legal, hospital and<br>lender input.|
|Lender product terms|Lender Product Owner|Signed product sheet, API contract, KFS,<br>facility/drawdown and SLA.|
|Legal / regulatory interpretation|Qualified legal counsel and Compliance|Current RBI/Gazette/other law; documented<br>advice.|
|Data classification / retention|Privacy/Compliance owner with lender|Data inventory, LSP agreement, privacy notice<br>and retention schedule.|
|RBAC / data access|Security + Product Owner|Role matrix, data classification, threat model and<br>test results.|
|Technical architecture|Engineering lead / architect|Architecture decision record, scalability/security<br>review and cost.|
|Hospital operational protocol|Operations + hospital authorised sponsor|Signed SOP and verified beneficiary evidence.|
|Production release|Product + Engineering + Operations + Compliance|Release-gate evidence and formal sign-off.|



### **20.2 Architecture decision records to create** 

|**ADR ID**|**Decision**|**Options to evaluate**|**Evidence required**|
|---|---|---|---|
|ADR-001|Case ID and FRID design|Random UUID/ULID, short human-<br>readable code plus secure token.|Guessability, supportability, leakage<br>analysis.|
|ADR-002|Borrower identity and app linking|OTP + invite, lender identity handoff,<br>account linking.|Fraud threat model and lender<br>requirements.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  50 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ADR ID**|**Decision**|**Options to evaluate**|**Evidence required**|
|---|---|---|---|
|ADR-003|Lender integration pattern|API-first, secure files, manual<br>fallback.|Lender contract, availability,<br>security and reconciliation.|
|ADR-004|Event/outbox architecture|Database outbox + queue, managed<br>event bus.|Delivery guarantees, ordering, replay<br>and cost.|
|ADR-005|Document handling|No storage, lender-hosted links,<br>tightly scoped storage.|RBI data rule, lender agreement,<br>malware and retention.|
|ADR-006|Native app technology|Cross-platform or native<br>Android/iOS.|Audience devices, offline<br>requirements, security and<br>maintenance.|
|ADR-007|Expense journal storage|Not offered; local-only; cloud sync.|Legal/NBFC approval, data-fiduciary<br>allocation and security.|
|ADR-008|Hospital portal referral/demand<br>functions|View-only first; limited demand<br>submit; referral only.|Hospital contract, staff controls and<br>process validation.|
|ADR-009|Status/event source-of-truth|Webhook, polling, statement<br>reconciliation.|Lender interface and false-positive<br>risk.|
|ADR-010|Analytics data model|Pseudonymous event store vs<br>operational replica.|Privacy, retention and reporting<br>needs.|



### **20.3 Open decision register** 

|**ID**|**Open question**|**Owner**|**Impact**|**Status**|
|---|---|---|---|---|
|D-001|What exactly triggers executive<br>case creation: referral,<br>admission, first bill or first<br>advance?|Founder + hospital operations|High|OPEN|
|D-002|Can one case have multiple<br>borrowers/co-applicants or<br>only one primary borrower?|Lender + Product|High|OPEN|
|D-003|Who is the legal borrower<br>when patient is a<br>minor/incapacitated?|Legal + lender|Critical|OPEN|
|D-004|Does hospital portal allow<br>referral/demand input or<br>remain view-only initially?|Founder + hospital|High|OPEN|
|D-005|Can hospital finance staff<br>verify all demands or only<br>designated users?|Hospital|High|OPEN|
|D-006|What hospital evidence is<br>sufficient for demand<br>verification?|Hospital + lender|High|OPEN|
|D-007|Can a case have multiple<br>financing applications to<br>different lenders<br>simultaneously?|Lender + legal|High|OPEN|
|D-008|Is multi-lender offer<br>comparison required from day<br>one?|Lender + compliance|High|OPEN|
|D-009|What lender matching criteria<br>and public ranking metric will<br>be used?|Product + compliance|High|OPEN|
|D-010|What lender products support<br>staged/multiple<br>disbursement?|Lender|Critical|OPEN|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  51 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**<br>D-011|**Open question**<br>Does additional utilisation<br>require borrower OTP, digital<br>signature, mandate or new<br>agreement?|**Owner**<br>Lender|**Impact**<br>Critical|**Status**<br>OPEN|
|---|---|---|---|---|
|D-012|How are interest accrual, EMI<br>reset, tenure and repayment<br>schedule handled after each<br>drawdown?|Lender|Critical|OPEN|
|D-013|Does each drawdown create<br>separate loan account or one<br>account?|Lender|Critical|OPEN|
|D-014|What happens to excess<br>hospital payment / refund and<br>whether it reduces principal?|Lender + hospital + legal|Critical|OPEN|
|D-015|What is definition of lender<br>confirmation vs bank credit<br>confirmation vs hospital<br>receipt?|Lender + hospital|High|OPEN|
|D-016|Can LSP store limited hospital<br>demand documents? Which<br>document classes and<br>retention?|Lender + legal|Critical|OPEN|
|D-017|Will mobile app expense<br>journal be permitted under<br>LSP DLA constraints?|Legal + NBFC compliance|Critical|OPEN|
|D-018|If journal is approved, is on-<br>device-only storage<br>acceptable and what does<br>“storage by LSP” mean in the<br>arrangement?|Legal + lender|Critical|OPEN|
|D-019|Can the app provide a user-<br>selected receipt scan or does<br>this create unacceptable data<br>storage/access?|Legal + lender|High|OPEN|
|D-020|Do patients get any portal<br>access when they are not<br>borrowers?|Founder + legal|High|OPEN|
|D-021|What borrower app identity<br>model and phone-change<br>recovery applies?|Security + lender|High|OPEN|
|D-022|Which NBFCs/banks and<br>exact lender products are<br>targeted?|Founder / Partnerships|Critical|OPEN|
|D-023|What service levels can each<br>lender contractually support?|Lender|High|OPEN|
|D-024|Who signs hospital agreement<br>and owns partner<br>relationship?|Founder + legal|High|OPEN|
|D-025|What is the permitted LSP<br>compensation basis and<br>conflict management?|Lender + legal|Critical|OPEN|
|D-026|Will any insurance claim<br>support be offered? Current<br>scope excludes it.|Founder + legal|Medium|OPEN|
|D-027|What languages are required<br>at initial operating locations?|Product + operations|Medium|OPEN|
|D-028|What are final hosting, cloud<br>region, DR and vendor<br>choices?|Engineering + security|High|OPEN|



CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  52 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

|**ID**|**Open question**|**Owner**|**Impact**|**Status**|
|---|---|---|---|---|
|D-029|What is the exact support<br>coverage and escalation roster<br>for hospital hours?|Operations|High|OPEN|
|D-030|Which reports are allowed for<br>hospital users and how long<br>are they retained?|Hospital + privacy|High|OPEN|
|D-031|What is the retention period<br>per event, document, consent,<br>complaint and audit class?|Legal + lender|Critical|OPEN|
|D-032|Which third-party KYC, SMS,<br>eSign, notification and<br>analytics vendors will be<br>engaged?|Engineering + lender + privacy|High|OPEN|
|D-033|Who is data fiduciary /<br>processor for each specific<br>data processing activity?|Legal + lender|Critical|OPEN|
|D-034|What happens when hospital<br>withdraws from network while<br>cases are still open?|Operations + legal|High|OPEN|
|D-035|What is the policy for<br>corrections to<br>patient/borrower identity after<br>application submission?|Lender + operations|High|OPEN|
|D-036|What is the permitted scope of<br>executive support in lender<br>application screens?|Lender + compliance|Critical|OPEN|
|D-037|What are the actual supported<br>ticket-size/tenor/product<br>eligibility bands?|Lender|High|OPEN|
|D-038|What is manual fallback<br>control and evidence standard<br>per lender?|Lender + operations|High|OPEN|
|D-039|What is case closure definition<br>and reopen policy?|Product + operations|Medium|OPEN|
|D-040|What borrower support and<br>lender complaint escalation<br>language is approved?|Lender + compliance|High|OPEN|



### **20.4 Requirement traceability and change control** 

- Every requirement has a stable ID. Tickets and test cases must reference requirement IDs. 

- Every product change records business reason, impacted roles, screens, entities, APIs, controls and tests. 

- Any change to lender product capability updates lender configuration version and affected case disclosure. 

- A change that affects consent, data collection, storage, funds flow or lender offer display requires compliance/legal review. 

- A change to hospital scope or borrower visibility requires ABAC/security test updates. 

- A requirement is not “done” until acceptance criteria pass, evidence is stored and product owner signs off. 

- Use an approved decision log; verbal assumptions are not specifications. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  53 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

## **21. Glossary and source register** 

### **21.1 Glossary** 

|**Term**<br>LSP|**Meaning**<br>Lending Service Provider; agent of regulated lender carrying out agreed digital<br>lending functions or parts thereof.|
|---|---|
|RE|Regulated Entity: bank, NBFC or other regulated lender within applicable RBI<br>framework.|
|DLA|Digital Lending App/Platform; mobile and/or web user interface facilitating digital<br>lending services, including LSP-operated interfaces where covered.|
|Borrower|Person who applies for/owes the loan.|
|Patient|Person receiving treatment; may be different from borrower.|
|FRID|Financing Reference ID; unique identifier for borrower linking to executive-<br>created financing case; not an authentication credential.|
|CASE_ID|Internal unique ID for one hospitalisation/treatment financing service episode.|
|DEMAND_ID|Unique identifier for a distinct hospital payment demand.|
|Funding Request|Request to lender to finance a specific hospital demand or permitted utilisation;<br>not itself approval.|
|APP_ID|Internal LSP application record identifier.|
|Lender Application Reference|External ID assigned by lender.|
|KFS|Key Facts Statement; lender-provided disclosure including APR and key terms.|
|APR|Annual Percentage Rate as defined under applicable RBI instructions and lender<br>disclosures.|
|Sanction|Lender approval with terms and conditions.|
|Facility|Approved credit limit/structure, if the lender product provides one.|
|Drawdown|Lender-approved utilisation under a facility.|
|Disbursement|Actual lender transfer to borrower or permitted end-beneficiary.|
|Hospital Receipt|Hospital confirmation of bank credit; distinct from lender transfer event.|
|ABAC|Attribute-Based Access Control; access restricted by context such as hospital,<br>branch, assignment and relationship.|
|RBAC|Role-Based Access Control; permissions assigned to roles.|
|Idempotency|A repeated request/event does not create duplicate business/financial action.|
|Maker-checker|Two-person control where one person proposes and another independently<br>approves.|
|System of record|Authoritative system for a specific data domain; hospital, lender and LSP each<br>own different records.|
|Data fiduciary / processor|Roles under DPDP Act to be mapped for each processing activity by counsel.|
|Cooling-off period|Lender-defined minimum one-day period under applicable RBI digital lending<br>framework during which borrower may exit on prescribed terms.|
|Specific end-use disbursement|Loan disbursal directly to end-beneficiary for a specific end use where RBI<br>conditions and lender product permit.|



### **21.2 Primary regulatory / source register (checked 9 November 2026)** 

**_[R1] RBI — Non-Banking Financial Companies – Credit Facilities Directions, 2025, updated 15 July 2026. Chapter III, Digital Lending: NBFCLSP arrangements, borrower protection, disbursement, grievance, data and DLA obligations._** 

_https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12957_ 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  54 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

**_[R2] RBI — Non-Banking Financial Companies – Managing Risks in Outsourcing Directions, 2025. Covers outsourcing governance, accountability, risk, security, continuity, exit and oversight._** 

_https://rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=12941_ 

**_[R3] MeitY / Gazette of India — G.S.R. 843(E), 13 November 2025. DPDP Act commencement notification and phased dates._** _https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf_ 

**_[R4] MeitY / Gazette of India — G.S.R. 846(E), 13 November 2025. Digital Personal Data Protection Rules, 2025 and phased commencement schedule._** 

_https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf_ 

**_[R5] RBI — Key Facts Statement (KFS) for Loans & Advances, 15 April 2024._** 

_https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12663&Mode=_ 

**_[R6] RBI — Non-Banking Financial Companies – Responsible Business Conduct Directions, 2025, updated 1 July 2026. Consult for KFS, fair practices, customer treatment and complaint-related requirements._** 

_https://www.rbi.org.in/Scripts/BS_ViewMasterDirections.aspx?did=401_ 

**_[R7] RBI — Non-Banking Financial Companies – Know Your Customer Directions, 2025, updated 29 December 2025. Lender-specific KYC obligations must be applied by the NBFC._** 

_https://www.rbi.org.in/Scripts/BS_ViewMasterDirections.aspx?did=401_ 

**_[R8] RBI — Digital Lending Directions, 2025 (consolidated baseline reference; confirm applicability and later amendments against current NBFC-specific directions)._** 

_https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12848_ 

**_[R9] CCPA — Guidelines for Prevention and Regulation of Dark Patterns, 2023. Apply to borrower-facing choice design as relevant._** _https://consumeraffairs.nic.in/_ 

**LEGAL DISCLAIMER** This document is a product/operations specification. It is not legal, regulatory, credit, tax or accounting advice. The regulatory source register is a research snapshot as of 9 November 2026; counsel and each regulated lender must validate current law, entity applicability, contractual controls and the final borrower journey before launch. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  55 

_HEALTHCARE FINANCING LSP  |  MASTER PRODUCT & OPERATING BLUEPRINT_ 

## **Appendix A. Approval and sign-off register** 

|**Function**|**Approver**|**What approval means**|**Status / date**|
|---|---|---|---|
|Founder / Business Owner|Name / signature:<br>__________________|Business model, scope, exclusions,<br>channel strategy and open decisions<br>accepted.|Pending|
|Product Owner|Name / signature:<br>__________________|Requirements, roles, screens,<br>states, acceptance criteria and<br>traceability accepted.|Pending|
|Engineering Lead|Name / signature:<br>__________________|Architecture, data model, APIs,<br>security and NFR feasibility<br>accepted.|Pending|
|Operations Lead|Name / signature:<br>__________________|Hospital/executive SOPs, exception<br>handling, staffing and support<br>processes accepted.|Pending|
|NBFC / Bank Partner|Name / signature:<br>__________________|LSP scope, lender product,<br>application journey, data access,<br>funds flow, SLA and integration<br>confirmed.|Pending|
|Legal / Compliance|Name / signature:<br>__________________|Regulatory perimeter, privacy, data,<br>funds flow, contracts, notices and<br>complaint obligations approved.|Pending|
|Security / Privacy Owner|Name / signature:<br>__________________|Threat model, VAPT, retention,<br>vendor, incident and access<br>controls accepted.|Pending|
|Hospital Partner|Name / signature:<br>__________________|Referral, demand evidence,<br>beneficiary verification, receipt<br>confirmation and portal visibility<br>accepted.|Pending|



_END OF MASTER PRODUCT & OPERATING BLUEPRINT_ 

CONFIDENTIAL WORKING DOCUMENT  •  v0.2  •  56 

