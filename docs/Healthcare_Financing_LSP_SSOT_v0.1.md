**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

#### **BUSINESS & PRODUCT DEFINITION** 

# **Healthcare Financing Lending Service Platform** 

_Single Source of Truth | Operating Model, Product Boundaries, Workflow and Lending Dependencies_ 

|**DOCUMENT CONTROL**|**VALUE**|
|---|---|
|Document status|Working baseline — captures decisions and current direction; not a final PRD or lender-<br>approved operating procedure.|
|Version|0.1|
|Date|09 November 2026|
|Geography|India|
|Business role|Technology-enabled Lending Service Provider (LSP) working with regulated lenders.|
|Primary operating channel|Hospital-based assisted financing desk, supported by QR/mobile web self-service.|
|Integration posture|Independent from hospital software at this stage; no HMS/billing-system integration<br>assumed.|



##### **PURPOSE OF THIS DOCUMENT** 

This document is the current reference for what the business is, what it is not, how the service is expected to work, what must be true for multi-stage disbursement, and which decisions remain dependent on lender capabilities or legal review. 

**Important:** This is a business and product definition. It is not legal advice, a credit policy, an NBFC term sheet, a hospital contract, or confirmation that any lender currently supports multi-drawdown medical financing. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     1 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

## **Document map** 

- 1. Executive definition 

- 2. The problem being solved 

- 3. Business model and role boundaries 

- 4. Product principles and non-goals 

- 5. Access channels and channel decisions 

- 6. End-to-end operating workflow 

- 7. Hospital payment stages and financing requests 

- 8. Multi-tranche lending: product mechanics and unresolved conditions 

- 9. Roles, responsibilities and systems of record 

- 10. Product and information architecture 

- 11. Data, consent, privacy and document handling 

- 12. Funds flow, borrower protection and regulatory guardrails 

- 13. Operational controls and exception handling 

- 14. Risks and failure modes 

- 15. Success measures 

- 16. Decisions required before product specification 

- 17. Glossary 

- 18. Reference basis and document governance 

##### **HOW TO READ THIS DOCUMENT** 

“Confirmed direction” means explicitly stated by the founder. “Proposed design” means a recommended way to implement that direction and still requires validation. “Lender-dependent” means it cannot be promised until a regulated lender confirms it in writing. “Out of scope” means excluded from the current business definition. 

## **1. Executive definition** 

The business is an independent, hospital-based digital lending service platform that helps patients and their families apply for eligible medical financing through regulated banks/NBFCs. It combines a physical financing desk operated by the LSP’s executive with a QR-accessible mobile web journey. The lender makes the credit decision and, where the loan is structured for a specific hospital expense, disburses directly to the hospital’s verified bank account. 

##### **CORE PROPOSITION** 

Make medical financing easy to access and fast to complete at the hospital, without requiring the hospital to change its existing software and without requiring the patient to install a native app. 

### **1.1 One-sentence definition** 

A hospital-distributed LSP platform that captures a patient’s financing requirement, facilitates the regulated lender’s application and approval process, coordinates borrower-authorised funding requests where the lender’s product permits them, and tracks direct lender-to-hospital disbursements. 

### **1.2 The operating idea** 

The hospital continues to run its own admission, treatment and billing operations. The LSP runs a separate financing workflow alongside those operations. The hospital’s payment demand triggers a financing request; it does not make the LSP responsible for hospital billing or for the family’s personal funding arrangements. 

|**Foundational principle**|**Meaning**|
|---|---|
|One hospitalisation, one financing|A case groups the LSP’s financing activity for one patient’s hospitalisation/treatment episode.|
|case|It is not a hospital account or a loan account.|
|Multiple payment demands may|Each hospital advance or interim payment demand can be captured as a separate funding|
|arise|request.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     2 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

|**Foundational principle**|**Meaning**|
|---|---|
|A funding request is not|The NBFC decides whether it is a drawdown under an existing facility, a partial disbursement,|
|automatically a loan tranche|a top-up/fresh loan, or not eligible.|
|Family contribution remains<br>personal|The family’s own contribution is outside the LSP workflow. The platform does not collect,<br>hold, allocate, or reconcile family funds.|
|Lender remains the lender|The regulated entity controls underwriting, sanction, loan documentation, disbursement,<br>loan account, interest and repayment.|



## **2. The problem being solved** 

Hospital payment requirements may arise at different points in a treatment episode. A patient may be asked to pay an admission advance, a pre-procedure or pre-surgery advance, an interim amount during treatment, or a final balance at discharge. The amounts and timing may change as the treatment progresses and the hospital updates its estimate or bill. 

A conventional loan journey is often designed around one fixed amount and one application. When the hospital’s payment requirement changes, the patient may have to repeat steps, the executive may have to contact the lender again, and the hospital may wait for confirmation. The intended service reduces repeated information capture and coordination delays while respecting the lender’s actual credit product. 

### **2.1 Friction to remove** 

- Repeated customer data entry across separate forms or lender journeys. 

- Repeated document collection when the same financing case is still active. 

- Unclear application ownership and no shared case reference between the executive, borrower and lender. 

- Unclear status: application received, documents pending, sanctioned, agreement executed, drawdown approved, payment initiated, or amount credited. 

- No reliable mapping between each hospital payment demand and the corresponding lender disbursement. 

- Unnecessary app-installation and account-creation friction during a stressful hospital event. 

- Manual follow-ups caused by the lack of a single operational view. 

### **2.2 What “seamless” means in this business** 

“Seamless” does not mean promising instant credit or bypassing lender checks. It means minimising avoidable steps, duplicate data capture, manual hand-offs and uncertainty. Credit assessment, required KYC, borrower consent, loan disclosures and lender authorisation remain mandatory where applicable. 

## **3. Business model and role boundaries** 

### **3.1 Business model** 

The company operates as an LSP engaged by one or more regulated entities (REs), subject to the applicable RBI framework and a formal agreement with each lender. The platform facilitates permitted customer acquisition, application processing, services incidental to underwriting/pricing, and agreed servicing or monitoring activities. It does not lend from its own balance sheet under the current model. 

|**Party**|**Role in the model**|
|---|---|
||Owns the technology and operating workflow; provides the financing desk; supports customer acquisition<br>l|
|LSP / platform company|and application completion; routes information to lenders; tracks workflow and disbursement status within<br>its contracted scope.|
|Bank / NBFC (regulated<br>lender)|Owns the credit product and decision; performs creditworthiness assessment; provides the offer/KFS and<br>loan documents; sanctions the facility; authorises drawdowns; disburses funds; maintains the loan account<br>and receives repayments.|
|Hospital|Introduces the financing option; identifies the payment requirement; provides a payment demand/estimate<br>and verified beneficiary details through the agreed offline or digital procedure; receives lender funds.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     3 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

|**Party**|**Role in the model**|
|---|---|
|Borrower / patient or eligible|Provides accurate information, KYC and consent; reviews lender terms; accepts the loan; authorises any|
|applicant|additional drawdown where required; remains responsible for repayment under the loan agreement.|
|Family members|May independently arrange the family’s contribution. Their payments and internal arrangements are personal<br>and outside the LSP’s financing records.|
|Insurer / TPA|Handles insurance processes under its own arrangements with the insured and/or hospital. The LSP does<br>not act as the claim administrator in the current scope.|



### **3.2 Explicit boundaries** 

##### **THE LSP DOES NOT** 

Make credit decisions; guarantee approval; set the lender’s interest rate or repayment terms; hold or route loan funds; receive loan repayments into an LSP account; manage the family’s contribution; run hospital billing; decide treatment; or promise insurance claim outcomes. 

The executive is a financing process coordinator, not a lender, credit underwriter, insurance assessor, cashier, or hospital billing authority. 

## **4. Product principles and non-goals** 

### **4.1 Product principles** 

- Independent operation: no dependency on hospital HMS or billing software at the current stage. 

- Assisted first: the physical LSP desk is the primary service channel; mobile web/QR is the self-service and assistedcompletion interface. 

- No mandatory native app: the borrower should be able to begin and complete the journey through a secure mobile web flow unless a lender requires a specific approved channel. 

- One case, multiple requests: a financing case groups successive hospital payment demands for one hospitalisation. 

- Borrower control: the borrower must see and authorise the financing action required by the lender; hospital staff or LSP executives must not impersonate the borrower. 

- Lender system of record: sanction, loan balance, interest, due dates and repayment status must come from the regulated lender. 

- No false speed promise: platform speed is measured separately from lender decision and bank settlement time. 

- Minimal data: collect only what is necessary for the agreed LSP activity and lender process. 

### **4.2 Current non-goals / out of scope** 

|**Not in current scope**|**Boundary**|
|---|---|
|Hospital software integration|No iFrame, API, plugin, HMS connector or billing-system integration is assumed now. Reconsider only<br>after operational proof and hospital/lender requirements are known.|
|Native patient app|No mandatory app download. The patient-facing channel is mobile web/QR for the current design<br>direction.|
|Hospital billing software|The LSP does not generate invoices, calculate final hospital dues, post deposits or reconcile the<br>hospital ledger.|
|Family contribution management|No recording or handling of family money, contributions, transfers, or their internal allocation.|
|Insurance claim administration|No TPA/insurer claim submission, claim adjudication, negotiation or reimbursement guarantee.|
|Own-book lending|No company-funded loans or use of the LSP’s own balance sheet to lend.|
|Credit guarantee / first-loss<br>support|No DLG, default guarantee, buyback, or credit-risk undertaking is assumed.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     4 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

**Not in current scope Boundary** No broad-purpose storage of medical records, bills, receipts or KYC documents as a consumer Medical record vault document wallet in the current LSP scope. 

## **5. Access channels and channel decisions** 

The three access approaches are not three separate businesses. They are possible entry points into one central LSP workflow. The current operating design prioritises the independent desk and mobile web channel. 

### **5.1 Primary channel: assisted financing desk** 

An LSP executive is stationed at or near the hospital’s designated financing desk. The hospital’s billing/admission staff directs a patient or family to the desk when a financing need arises. The executive creates the financing case, captures the payment demand, guides the borrower through the digital application and follows the lender workflow. 

The executive must not guarantee approval, collect borrower-side facilitation fees, handle cash, accept the borrower’s OTP/PIN for them, or alter lender disclosures. Borrower authentication and acceptance must remain with the borrower through the lenderapproved flow. 

### **5.2 Secondary channel: QR-based mobile web** 

A QR code or secure link allows a patient/family member to open a mobile-friendly application without installing a native app. The link should ideally reference an existing financing case or a pre-created request, rather than opening a generic landing page that forces the patient to re-enter hospital and payment details. 

The QR journey can be used independently by the family or alongside the executive. It is an access method; it does not replace the central case and lender workflow. 

### **5.3 Deferred channel: iFrame / HMS embedding** 

Embedding an EMI/financing option inside existing hospital software was considered. It is not part of the current operating plan because the company is not ready to integrate with hospital systems and wants to remain independent and faster to deploy. An iFrame alone would not solve repeat onboarding, lender workflow, document duplication or multi-stage payment handling. 

Future integration should be considered only if a specific hospital opportunity, proven workflow and integration business case justify it. It must not become a prerequisite for the core service. 

### **5.4 Native application** 

A dedicated native app could later support repeat patients and ongoing engagement, but it introduces installation and activation friction at the point of urgent need. The current direction is a responsive mobile web journey and secure case link. A native app is deferred unless demonstrated repeat-use behaviour makes it worthwhile. 

|**Channel**|**Current position**|**Why**|
|---|---|---|
|Executive desk|Primary|Human assistance at the point of hospital payment; no app installation or<br>HMS integration required.|
|QR / mobile web|Secondary; part of current<br>design|Fast access, self-service or assisted completion, and one reusable case<br>link.|
|iFrame / HMS|Deferred|Not ready; integration dependency would slow independent operations.|
|Native app|Deferred|Potential activation friction; not necessary to complete the initial<br>financing journey.|



## **6. End-to-end operating workflow** 

The following is the target workflow. Individual steps and required documents will vary by lender and must be mapped to each lender’s product and operating procedure. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     5 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

|**Stage**|**Target activity**|
|---|---|
|1. Financing need identified|Hospital staff or the patient identifies a payment requirement. The hospital refers the patient/family to the<br>LSP desk or shares a QR/link.|
|2. Case created|LSP executive creates a unique financing case for the patient’s hospitalisation/treatment episode. Record<br>only the information required for the agreed process.|
|3. Payment demand captured|Executive captures the current amount requested by the hospital, due timing, purpose/stage, hospital<br>identity and supporting demand evidence accepted by the lender.|
|4. Borrower onboarding and<br>consent|Borrower opens the secure web journey, verifies contact details, provides required information and gives<br>explicit consent for data collection and lender sharing. KYC is performed through the approved lender<br>process.|
|5. Lender application<br>submitted|LSP transmits or facilitates submission of the application and supporting information through the lender-<br>approved mechanism.|
|6. Lender assessment|Regulated lender performs creditworthiness assessment and determines eligibility, amount, pricing, tenor,<br>conditions and approval/decline.|
|7. Offer and disclosures|Borrower receives and reviews lender identity, loan amount, APR, tenor, repayment obligation, penal<br>charges where applicable, KFS and other required documents.|
|8. Loan acceptance and<br>agreement|Borrower accepts the chosen offer and executes lender documentation/authentication. The LSP records<br>workflow status but does not substitute for the lender’s agreement process.|
|9. Disbursement to hospital|For an eligible specific end-use loan, lender sends funds directly to the verified hospital beneficiary<br>account. No loan amount is routed through the LSP.|
|10. Confirmation and case<br>update|LSP records lender-provided disbursement status and transaction reference; hospital receipt confirmation<br>may be captured under the agreed operating procedure.|
|11. Additional request, if<br>needed|A later hospital payment demand is captured as a new funding request against the same financing case. It<br>is processed only under a lender facility that permits the relevant additional disbursement or through a<br>fresh/top-up loan process.|
||The LSP closes its operational case when the hospital episode’s financing workflow is complete, open|
|12. Case closure|requests are resolved and its records are reconciled to lender-provided transactions. The lender remains<br>the authoritative source for loan balance and repayment.|



##### **CRITICAL SEPARATION** 

A hospital demand, an LSP funding request, an NBFC loan application, a lender sanction, a drawdown authorisation and a bank disbursement are different events. The platform must represent them separately. A request is not proof of approval or payment. 

## **7. Hospital payment stages and financing requests** 

The hospital may ask for money at multiple points. The LSP should capture each request without assuming that the hospital’s payment schedule maps one-to-one to loan tranches. 

### **7.1 Proposed case structure** 

|**Record**|**Purpose**|**Example identifier**|
|---|---|---|
|Patient reference|Identifies the borrower/patient as permitted by data rules.|PAT-…|
|Financing case|Groups LSP activity for one hospitalisation/treatment episode.|CASE-…|
|Payment-demand record|Captures the hospital’s current request and its evidence.|DEM-…|
|Funding request|Captures the amount the borrower asks to finance from a lender.|FREQ-…|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     6 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

|**Record**|**Purpose**|**Example identifier**|
|---|---|---|
|Lender application|Tracks the application submitted to a particular lender.|APP-…|
|Sanction / facility reference|Tracks lender-approved terms and any permitted facility limit.|SAN-…|
|Drawdown / tranche record|Tracks a lender-authorised utilisation under a facility, if supported.|DRAW-…|
|Disbursement record|Tracks the actual lender-to-hospital transfer.|DISB-…|
|Loan account reference|Points to the lender’s authoritative account.|LOAN-…|



### **7.2 Illustrative timeline (not a prescribed hospital process)** 

|**Time**|**Hospital event**|**LSP action**|**Lender event**|
|---|---|---|---|
|Admission|Hospital asks for an advance.|Create case; capture demand; initiate funding<br>request.|Assess application; sanction/decline;<br>disburse if accepted and conditions<br>met.|
|Before<br>procedure|Hospital asks for additional<br>advance.|Create a new demand and funding request under<br>the same case.|Determine whether existing facility<br>permits another drawdown or fresh<br>credit assessment is required.|
|During stay|Interim charges are raised.|Capture only the amount the borrower seeks to<br>finance; do not manage the family’s contribution.|Authorise and disburse only under the<br>approved product and borrower<br>authorisation.|
|Discharge|Final hospital bill is settled by<br>hospital.|Record final financing-related status and<br>references; do not run hospital ledger<br>reconciliation.|Provide authoritative loan statement,<br>outstanding balance and repayment<br>information.|



### **7.3 Family contribution boundary** 

The family may use savings, relatives’ transfers, employer support or other personal sources to pay part of the hospital amount. Those flows are personal. The LSP records only the borrower’s requested financing, the lender’s sanctioned/approved amount and lender disbursement status. It does not collect, custody, allocate or reconcile family money. A hospital may independently reconcile all amounts received in its own billing system. 

## **8. Multi-tranche lending: product mechanics and unresolved conditions** 

Multi-stage hospital billing is an operating fact to accommodate. Multi-tranche lending is not yet a confirmed lender capability. The platform must not assume that every new hospital demand can be drawn from one previously sanctioned amount. 

### **8.1 Three distinct lender structures** 

|**Structure**|**What it means**|**Product implication**|
|---|---|---|
||Lender releases one approved amount to the|Operationally simplest, but may create<br>i|
|Single upfront disbursement|hospital. The hospital may account for it against<br>later charges.|excess/unused funds if final charges are lower or<br>treatment changes.|
|One facility with multiple<br>drawdowns / staged<br>disbursements|Lender approves a facility or loan structure that<br>expressly permits more than one utilisation. Each<br>drawdown follows agreed conditions.|Closest fit to the desired workflow, but only if the<br>lender supports it contractually and operationally.|
|Separate loans or top-ups|Each new financing requirement is processed as a<br>new loan or additional credit decision.|May repeat KYC, underwriting, disclosures and<br>agreements; likely more friction.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     7 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

### **8.2 Important financial distinctions** 

- A sanctioned limit is not the same as money disbursed. An undrawn amount is not automatically available for use unless the lender’s contract expressly permits it. 

- A hospital payment demand is not automatically a drawdown. It first needs to be validated and accepted under the lender’s product rules. 

- A disbursement is not necessarily a new loan account. One account may support multiple disbursements, or each may create a separate account, depending on the lender product. 

- Interest accrual is not the same as interest compounding. Interest may accrue on each disbursement from its applicable value date; whether unpaid interest is capitalised or compounded depends on the loan contract and applicable rules. 

- EMI commencement and repayment schedules may differ between a single-disbursement term loan and a stageddisbursement facility. The lender must specify how each disbursement affects repayment. 

- The platform must not calculate or display an estimated “live interest” figure as authoritative unless the lender supplies the exact rate, day-count basis, accrual convention, fees and transaction dates. 

### **8.3 What must be confirmed in writing by each NBFC** 

|**Topic**|**Question to resolve**|
|---|---|
|Facility type|Is the product a term loan with staged disbursement, a multiple-drawdown facility, a revolving facility, or a<br>set of separate loans?|
|Availability period|How long does the sanctioned facility remain available for additional disbursements?|
|Conditions precedent|What hospital evidence, invoice/demand proof, borrower authorisation and internal checks are required for<br>each additional disbursement?|
|Borrower approval|Is explicit borrower authorisation required for every drawdown? What approved authentication method is<br>used?|
|Interest calculation|Does interest accrue only on amounts disbursed? What is the value date, rate basis, day-count convention<br>and capitalisation treatment?|
|Repayment schedule|When does EMI begin? Does each tranche change EMI, tenor, due date or amortisation schedule?|
|Fees and charges|Are there processing, drawdown, documentation, commitment, cancellation, foreclosure or other charges?|
|Undrawn amount|Can unused sanctioned amounts be cancelled? Are there fees or obligations on unused amounts?|
|Over-disbursement / refund|What happens if the final hospital bill is lower than the amount disbursed? Who receives and applies a<br>refund?|
|Account and statement|Can the lender provide a consolidated account statement with each disbursement, date, amount, interest<br>and repayment allocation?|
|System access|Can the lender expose application, sanction, drawdown and payment status through an API, portal or secure<br>operational process?|



##### **DESIGN RULE** 

Do not build a “credit line” experience until a lender has confirmed that its regulated product is actually a credit facility with repeat drawdown rights. A single sanction amount does not, by itself, create permission to release arbitrary future tranches. 

## **9. Roles, responsibilities and systems of record** 

### **9.1 Responsibility matrix** 

|**Activity**|**LSP**|**Lender**|**Hospital**|**Borrower**|
|---|---|---|---|---|
|Introduce financing option / capture<br>referral|Responsible|Oversight under agreement|May refer|Chooses whether to<br>proceed|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     8 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

|**Activity**|**LSP**|**Lender**|**Hospital**|**Borrower**|
|---|---|---|---|---|
|Capture hospital payment demand|Facilitate|Defines acceptable<br>evidence|Provides demand|Reviews amount/purpose|
|Collect application information|Facilitate|Defines required data|No credit role|Provides accurate<br>information|
|KYC and borrower verification|Support approved flow|Responsible / controls<br>process|No role unless separately<br>authorised|Completes authentication|
|Creditworthiness assessment|No decision|Responsible|No role|Provides information|
|Sanction and pricing|No decision|Responsible|No role|Reviews offer|
|Loan agreement and KFS|Facilitate<br>delivery/status|Issues and owns|No role|Reviews and accepts|
|Drawdown request|Capture/route|Determines eligibility and<br>authorises|Provides demand evidence|Authorises where required|
|Funds transfer|No custody/control|Responsible|Receives funds|Borrower is liable under<br>agreement|
|Loan account, interest, EMI and<br>repayment|Display/route if<br>contracted|System of record|No role|Repays lender|
|Family contribution|Out of scope|Out of scope|Reconciles in hospital<br>ledger|Arranges privately|
|Insurance claim|Out of scope|Only if lender product<br>requires relevant<br>information|Insurer/TPA process may<br>involve hospital|Insured/claimant<br>participates|



### **9.2 Systems of record** 

|**Information**|**Authoritative system**|**LSP platform role**|
|---|---|---|
|Hospital estimate, demand slip<br>and final bill|Hospital billing records|Capture reference/evidence required for financing; not official<br>ledger.|
|Loan application and status|Lender system|Track the LSP workflow and lender response.|
|Sanctioned terms, APR, KFS and<br>loan agreement|Lender system / lender-issued documents|Present or link to lender-issued information; do not create<br>alternative terms.|
|Disbursed amount and bank<br>transaction reference|Lender / banking records|Track lender-confirmed status and reference.|
|Outstanding principal, accrued<br>interest, EMI and repayments|Lender loan account|Display lender-provided information; never substitute an LSP<br>calculation.|
|Family contributions|Family and hospital records|Not collected or reconciled by LSP.|
|Insurance coverage and claim<br>status|Insurer/TPA/hospital/insured records|Not an LSP system of record in the current scope.|



## **10. Product and information architecture** 

The platform should be designed as a standalone LSP workflow. It should not depend on hospital software integration. Lender connectivity, however, will be required through whatever approved interface each lending partner makes available; no API capability should be assumed until confirmed. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     9 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

### **10.1 Logical components** 

|**Component**|**Purpose**|**Boundary**|
|---|---|---|
|Executive console|Create and manage cases, capture hospital demands,<br>support borrower onboarding, track applications and<br>escalations.|Operational workspace; no credit decision or<br>cash handling.|
|Borrower mobile web|Secure link/QR, data capture, consent, lender hand-off,<br>review of offers and lender-authorised actions.|No mandatory app install; lender controls<br>KYC and contractual acceptance.|
|Case and request workflow|Maintain case IDs, demand records, funding requests,<br>status history and exception queues.|LSP workflow record, not hospital ledger or<br>loan ledger.|
|Lender connectivity layer|Submit/route applications and receive<br>status/decision/disbursement data.|API, partner portal or controlled manual<br>process based on each lender’s approved<br>method.|
|Document handling<br>workflow|Collect/transfer only documents required for the lender<br>process.|Storage and retention constrained by RBI<br>rules and RE-LSP agreement.|
|Audit and access control|Record actor, timestamp, action, consent, change and<br>exception history.|Tamper-evident operational audit trail;<br>sensitive data minimised.|



### **10.2 Minimum data relationships** 

A case should group related records, but it should not collapse different financial events into one status field. The conceptual relationship is: 

##### **RELATIONSHIP MODEL** 

Patient reference → Financing case → one or more hospital payment-demand records → one or more funding requests → one or more lender applications/offers → sanction/facility reference → one or more authorised drawdowns (if supported) → one or more actual disbursements → lender loan account reference. 

### **10.3 Status model** 

|**Object**|**Illustrative statuses**|
|---|---|
|Financing case|Created; onboarding pending; active; waiting on lender; active funding; discharge/close-out pending; closed;<br>cancelled.|
|Funding request|Draft; submitted for borrower review; borrower authorised; sent to lender; lender review; approved; declined;<br>cancelled; expired.|
|Lender application|Submitted; KYC pending; documents pending; under review; sanctioned; rejected; withdrawn; agreement<br>pending; disbursed.|
|Drawdown request|Created; evidence pending; borrower authorisation pending; lender review; approved; rejected; cancelled;<br>expired.|
|Disbursement|Initiated; processing; credited/confirmed; failed; reversed/refunded; status unknown / reconciliation<br>required.|



These are proposed workflow labels, not RBI-prescribed statuses. The final state model must map to each lender’s actual responses and avoid labelling an initiated transfer as “credited”. 

## **11. Data, consent, privacy and document handling** 

The platform is a digital lending platform operated by an LSP for a regulated entity. The RBI Digital Lending Directions, 2025 therefore affect the design of the website/mobile web, executive console, document processing, data sharing, storage and borrower interface. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     10 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

### **11.1 Data handling principles** 

- Collect data only when it is necessary for the contracted LSP activity or lender application. 

- Obtain prior and explicit borrower consent with an auditable record; state the purpose at each stage and obtain consent before sharing personal information with a third party, except where legally required. 

- Provide applicable options to grant/deny specific data use, restrict third-party disclosure, revoke consent and request deletion/forgetting as required by the Directions. 

- Do not access contacts, call logs, telephony functions or broad device storage. Any limited camera/location/microphone access for onboarding/KYC must follow the applicable explicit-consent conditions. 

- Do not treat the platform as a permanent repository for medical bills, prescriptions, test reports, identity documents or insurance records. 

- Under the RBI Directions, the RE must ensure that an LSP does not store borrower personal information except limited basic information that may be required for operations/service within the RE-LSP agreement. Define exact permitted fields and retention with the lender and counsel. 

- RBI requires data-storage arrangements to comply with its location and security requirements, including India-based server storage under the Directions. 

- Access must be role-based. Executives should see only the cases and information needed for their work. 

### **11.2 Document handling direction** 

##### **CURRENT DIRECTION** 

Prefer lender-controlled document collection or secure transfer to the lender-approved destination. If the LSP temporarily handles a document, the permitted purpose, access, storage location, retention period, deletion process and security controls must be expressly approved under the RE-LSP arrangement and reviewed by legal/compliance. 

### **11.3 Patient document vault** 

A broad patient-facing vault for storing medical records, receipts, insurance documents and personal documents is not part of the current LSP product definition. It may create a separate data controller/processor, privacy, security and retention proposition that is unnecessary to the immediate lending-facilitation goal. Do not add it as a convenience feature without a separate legal and product assessment. 

## **12. Funds flow, borrower protection and regulatory guardrails** 

### **12.1 Funds flow** 

The expected flow for a specific hospital-expense loan is regulated lender → verified hospital bank account, where direct endbeneficiary disbursement is permitted and the loan is structured for that specific end use. The LSP must not receive, pool, route, control or temporarily hold the loan proceeds. 

Loan repayment and servicing must occur directly between borrower and regulated lender, without an LSP pass-through or pool account. The lender pays LSP fees/charges under the contract; the LSP must not separately charge or collect its LSP fee from the borrower under the RBI Directions. 

### **12.2 Borrower protection** 

- The borrower must receive lender-issued KFS and required loan documents, including APR and applicable charges, before acceptance as prescribed. 

- Where the LSP has arrangements with multiple lenders, matching offers must be displayed fairly and objectively with prescribed comparison details; the matching method must be consistent and documented. 

- The borrower must not be pushed towards a lender through hidden ranking, dark patterns or misleading claims. 

- The lender remains responsible for creditworthiness assessment, loan approval and the loan account. 

- Customer grievance contacts and escalation route must be visible in the required lender/LSP channels. The lender’s grievance responsibility remains with the lender, while the LSP must designate the required nodal grievance contact where it interfaces with borrowers. 

- The borrower must be told that financing is subject to lender assessment and that insurance reimbursement or claim approval is not guaranteed. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     11 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

### **12.3 Important regulatory reference points** 

|**RBI Digital Lending Directions, 2025**|**Product relevance**|
|---|---|
|Para 4 — definitions|Defines digital lending, DLA and LSP. Web/mobile platforms operated by an LSP can fall within DLA<br>scope.|
|Para 5 — RE-LSP due diligence|Requires contractual arrangements, lender due diligence, periodic review and lender oversight of LSP<br>conduct.|
|Para 6 — multiple lenders|Requires fair digital presentation of matching offers and disclosure of unmatched lenders, consistent<br>matching logic, relevant loan details and KFS links.|
|Paras 7–8 — creditworthiness and<br>disclosures|Lender assesses borrower creditworthiness and provides KFS and relevant loan<br>documents/disclosures.|
|Para 9 — disbursal, servicing and repayment|Specific end-use loans may be disbursed directly to the end-beneficiary; prohibits third-party/LSP<br>pass-through accounts and LSP control of fund flows; LSP fees paid by RE.|
|Paras 12–15 — data and technology|Need-based collection, explicit consent, restrictions on device access, limited LSP data storage,<br>privacy policy and technology/security requirements.|
|Para 17 — reporting of DLAs|RE reports relevant DLAs operated by itself or its LSP to RBI through CIMS under the Directions.|



##### **REGULATORY CAUTION** 

The RBI Directions are a baseline, not the complete legal review. The exact LSP activities, web application/DLA reporting, outsourced activity, document flow, lender contracts, hospital arrangements, consumer protection and applicable dataprotection law must be reviewed by qualified Indian regulatory counsel before launch. 

## **13. Operational controls and exception handling** 

### **13.1 Control objectives** 

|**Control**|**Expected design**|
|---|---|
|Hospital identity and<br>beneficiary verification|Maintain an approved hospital/branch directory and verified beneficiary bank details. Changes to bank<br>details require documented verification and maker-checker approval.|
|Payment-demand evidence|Define acceptable demand proof with each lender (estimate, advance demand slip, interim bill or<br>equivalent). Capture amount, date, purpose/stage and source.|
|Borrower authorisation|Show amount, beneficiary, lender/product and material consequences. Use the lender-approved<br>authentication method. The executive must not enter or retain the borrower’s PIN/OTP.|
|Duplicate request prevention|Use unique request IDs and check for duplicate active demands/disbursements before submission.|
|Disbursement status accuracy|Separate initiated, processed, credited, failed and unknown states. Do not mark as paid solely because a<br>lender initiated a transaction.|
|Audit trail|Record user, action, date/time, consent, status change, evidence reference and exception disposition.|
|Role-based access|Restrict executive, supervisor, operations and administrator permissions; log sensitive access.|
|Complaint and escalation|Show lender and LSP contact routes; define response ownership and escalation to lender.|
|No cash / no pass-through|Executives do not collect cash, hold cheques, accept loan proceeds or route borrower repayments.|



### **13.2 Exception scenarios to design for** 

- Lender sanction is lower than the amount requested by the borrower. 

- Borrower withdraws or treatment plan changes after sanction but before disbursement. 

- An additional hospital demand arises but the lender facility does not permit a further drawdown. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     12 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

- Borrower cannot complete KYC or authentication because of time, connectivity or accessibility issues. 

- Lender status is delayed, unavailable or inconsistent with the bank transaction reference. 

- Disbursement fails, is delayed, is reversed or reaches an incorrect beneficiary account. 

- Hospital changes beneficiary bank details or the bill reference after the application is submitted. 

- Final bill is lower than funds already disbursed; excess/refund treatment must follow hospital and lender contracts. 

- Final bill exceeds financing available; the LSP records only the lender financing status and does not manage family funds. 

- Insurance claim is delayed/rejected or reimbursed for a different amount; the LSP does not promise that insurance proceeds will repay the loan. 

## **14. Risks and failure modes** 

|**Risk**|**Why it matters**|**Required response**|
|---|---|---|
|Lender does not support<br>multiple drawdowns|The key multi-stage experience may not be<br>possible with the selected loan product.|Treat additional demand as a new lender decision unless<br>contractual drawdown rights are confirmed. Secure written<br>product specifications before promising the flow.|
|Interest/EMI confusion|Borrower may misunderstand how each<br>disbursement changes interest, principal, EMI or<br>tenure.|Display only lender-supplied authoritative calculations;<br>ensure KFS/statement explains pricing and repayment.|
|Hospital demand is inaccurate<br>or duplicated|Could result in wrong or repeated disbursement.|Demand evidence, unique request IDs, beneficiary verification<br>and duplicate checks.|
|Borrower authorisation is weak|Patient may be unaware of the amount or use of<br>funds.|Borrower-facing confirmation of each required action; lender-<br>approved authentication; audit trail.|
|LSP stores too much personal<br>data|Creates regulatory, privacy and breach exposure.|Data minimisation; lender-controlled document workflow;<br>written retention and deletion rules.|
|Disbursement is delayed|Hospital may continue to wait despite loan<br>approval.|Measure lender decision time separately from disbursement<br>settlement; escalation and status visibility.|
|Family contribution is mixed<br>with loan funds|Blurs responsibility and can create reconciliation<br>disputes.|Do not collect/manage family funds; keep LSP records strictly<br>to financing activity.|
|Executive overpromises or<br>mis-sells|Can cause borrower harm and<br>regulatory/reputational risk.|Scripts, training, disclosures, call/desk audits, complaint<br>handling and no-approval-guarantee rule.|
|Hospital bypasses the LSP|Hospital may prefer direct lender partnerships or<br>another finance provider.|Deliver measurable reduction in waiting time and<br>administrative burden; do not rely on exclusivity unless<br>contracted.|
|Single-lender concentration|One lender’s policy or downtime can stop the<br>service.|Evaluate additional lender partnerships; if multi-lender,<br>implement RBI offer-display and matching requirements.|



## **15. Success measures** 

Measure whether the service removes friction. Do not treat app downloads, raw lead count or sanctioned amount alone as proof that the experience is seamless. 

|**Measure**|**Definition / reason**|
|---|---|
|Time to complete borrower application|Elapsed time from case initiation to completed application submission; separates<br>platform/process friction from lender credit time.|
|First-time-right submission rate|Share of applications submitted without avoidable rework or missing information.|
|Borrower repeat-entry count|How often the same borrower has to re-enter data already captured and lawfully reusable.|
|Lender decision time|Time from complete submission to lender decision; reported separately from LSP handling time.|
|Decision-to-disbursement time|Time from sanction/required acceptance to lender-confirmed hospital credit.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     13 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

|**Measure**|**Definition / reason**|
|---|---|
|Funding-request cycle time|Time from a valid additional request to lender outcome and confirmed disbursement, where the<br>product supports it.|
|Request-to-disbursement conversion|Share of valid funding requests that result in successful lender disbursement.|
|Manual touches per case|Number of executive/operations interventions needed to complete a financing case.|
|Status-chasing contacts|Number of follow-ups required because status was not available or clear.|
|Disbursement reconciliation exceptions|Count and value of mismatches between lender disbursement records and hospital receipt<br>confirmation.|
|Borrower complaints / mis-selling<br>incidents|Customer protection and process-quality indicator.|



## **16. Decisions required before product specification** 

The items below are intentionally not presented as settled. They require lender confirmation, hospital operating agreement, legal/compliance review or founder decision. 

|**Decision / question**|**Why it remains open**|**Required owner / evidence**|
|---|---|---|
|Which lender product supports staged<br>use?|Multiple drawdowns, partial disbursement, top-up<br>and repeat loans are not interchangeable.|NBFC product team + credit/legal; written<br>product note/term sheet.|
|Single lender or multiple lenders?|Multi-lender comparison triggers specific RBI<br>requirements; lender concentration affects<br>resilience.|Founder + lender BD + compliance; commercial<br>and compliance assessment.|
|Borrower authentication for each<br>drawdown|Need to balance speed with genuine borrower<br>control and lender policy.|NBFC operations/compliance; approved journey<br>and authentication specification.|
|What hospital evidence is acceptable?|Each lender may require different proofs for each<br>payment request.|NBFC + hospital billing team; written checklist.|
|How is hospital beneficiary verified?|Direct disbursement requires correct end-beneficiary<br>account.|NBFC finance/operations + hospital; bank<br>verification SOP.|
|What is the exact interest and EMI<br>treatment?|Daily accrual, rate basis, day-count,<br>compounding/capitalisation, EMI start and tenure<br>vary by product.|NBFC product/legal; sample amortisation and<br>statements for multiple drawdowns.|
|What happens to excess funds or<br>refunds?|Final hospital bill may be less than the amount<br>disbursed.|NBFC + hospital; documented refund and loan<br>adjustment procedure.|
|What data can the LSP retain?|RBI limits LSP storage of borrower personal<br>information.|NBFC DPO/compliance + Indian counsel; data<br>map and retention schedule.|
|How will lender status be received?|API, lender portal and secure manual processes<br>create different operational loads.|NBFC technology/operations; integration<br>specification.|
|Which services does the LSP provide<br>after disbursement?|Monitoring, servicing, support and recovery<br>assistance require contract and role clarity.|NBFC + LSP legal/compliance; LSP agreement<br>and SOP.|
|Who handles borrower complaints and<br>escalation?|LSP borrower interface and lender responsibility<br>must be clearly disclosed.|NBFC + LSP compliance; grievance matrix and<br>contact details.|
|What is the LSP commercial|Fees must be structured consistently with RBI|Founder + NBFC + counsel; executed|
|arrangement?|requirements and lender agreement.|commercial schedule.|



CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     14 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

## **17. Glossary** 

|**Term**|**Meaning in this document**|
|---|---|
|LSP|Lending Service Provider: an agent engaged by a regulated entity to perform one or more permitted digital lending<br>functions.|
|RE|Regulated Entity, such as a bank or NBFC covered by RBI Digital Lending Directions.|
|DLA|Digital Lending App/Platform. The RBI definition includes mobile and web-based applications facilitating digital lending,<br>including relevant LSP-operated platforms.|
|Borrower|The person who applies for and, if approved, becomes liable under the lender’s loan agreement. The patient and borrower<br>may not always be the same person.|
|Financing case|The LSP’s operational grouping for one hospitalisation/treatment episode.|
|Payment demand|The hospital’s request for payment at a particular stage, supported by evidence acceptable to the lender.|
|Funding request|The borrower’s request to finance some or all of a defined payment demand.|
|Loan application|The application submitted to a regulated lender for credit assessment.|
|Sanction|The lender’s approval subject to its terms and conditions. It is not itself proof that funds have been disbursed.|
|Facility / sanctioned limit|The lender-approved credit arrangement and its permitted availability. It does not imply unrestricted repeat drawdown<br>rights.|
|Drawdown|A utilisation of a facility where the lender’s product expressly permits it.|
|Tranche|One portion of a loan/facility disbursed under an agreed staged-disbursement structure.|
|Disbursement|The actual transfer of loan funds by the lender to the borrower or, for an eligible specific end-use loan, directly to the end-<br>beneficiary.|
|Outstanding principal|The unpaid principal recorded by the lender, after accounting for principal repayments and adjustments.|
|Interest accrual|Interest calculated over time on the applicable outstanding/disbursed amount according to the loan agreement.|
|Compounding / capitalisation|Adding accrued interest to principal so subsequent interest may be calculated on the increased principal, where<br>contractually and legally applicable. This is distinct from ordinary daily interest accrual.|
|APR|Annual Percentage Rate: the lender-disclosed annualised cost measure used in the KFS framework.|
|KFS|Key Fact Statement issued by the lender containing key loan terms and disclosures.|
|TPA|Third Party Administrator involved in health insurance administration; not an LSP function in the current scope.|
|Reimbursement claim|A claim where the insured/patient or claimant pays the expense and subsequently seeks reimbursement under the policy,<br>subject to terms and adjudication.|



## **18. Reference basis and document governance** 

### **18.1 Primary regulatory source** 

Reserve Bank of India, Reserve Bank of India (Digital Lending) Directions, 2025, RBI/2025-26/36, DOR.STR.REC.19/21.07.001/2025-26, dated 08 May 2025. The document is available on the RBI website: 

<u>https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12848</u> 

Key provisions referenced in this document: paragraph 4 (definitions); paragraph 5 (RE-LSP due diligence); paragraph 6 (multiplelender arrangements); paragraphs 7–8 (creditworthiness and borrower disclosures); paragraph 9 (disbursal, servicing and repayment); paragraph 11 (grievance redressal); paragraphs 12–15 (data, storage, privacy and technology); paragraph 17 (DLA reporting). 

### **18.2 Interpretation note** 

Regulatory summaries in this document are operational design notes, not legal opinions. The RBI Directions should be read in full with subsequent amendments, applicable outsourcing instructions, data-protection law and any product-specific rules. The 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     15 

**HEALTHCARE FINANCING LSP  |  WORKING SOURCE OF TRUTH** 

lender’s compliance/legal team and independent Indian regulatory counsel must validate the operating model before any live borrower journey is launched. 

### **18.3 How this source of truth should be updated** 

Update the version and date whenever a business rule, role boundary, lender product assumption or workflow changes. Label new content as Confirmed, Proposed, Lender-dependent, Legal review required or Out of scope. Keep lender-specific terms in linked lender product documents rather than replacing them with generic assumptions. When a decision is made, update the relevant section and open-decisions table together. Any expansion beyond the LSP role (for example insurance claim administration, a document vault, lending or risk-sharing) requires a separate scope and regulatory assessment. 

CONFIDENTIAL WORKING DOCUMENT  •  v0.1  •  09 NOV 2026     |     16 

