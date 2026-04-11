DELETE FROM public.document_constructor_documents
WHERE template_id IN (
    SELECT id FROM public.document_constructor_templates
    WHERE code = 'work-completion-certificate'
);

DELETE FROM public.document_constructor_templates
WHERE code = 'work-completion-certificate';

INSERT INTO public.document_constructor_templates (
    code,
    name,
    category,
    description,
    version,
    is_active,
    is_system,
    schema_json,
    layout_json,
    created_at,
    updated_at
)
VALUES (
    'construction-service-agreement',
    'Service Agreement',
    'Contracts',
    'A practical service agreement for construction and engineering services with optional legal clauses and ready-to-use formal wording.',
    2,
    TRUE,
    TRUE,
    $$[
      {
        "key": "parties",
        "title": "Parties",
        "description": "Confirm the legal parties and their representatives.",
        "fields": [
          {"key": "agreementDate", "label": "Agreement date", "type": "date", "required": true, "helperText": "Date the agreement is signed.", "defaultValue": "2026-04-11"},
          {"key": "customerCompany", "label": "Customer company", "type": "text", "required": true, "placeholder": "LLP SmartQurylys Development", "helperText": "Legal name of the customer.", "validation": {"minLength": 3, "maxLength": 120}},
          {"key": "customerAddress", "label": "Customer address", "type": "text", "required": true, "placeholder": "16 Abylai Khan Avenue, Almaty, Kazakhstan", "helperText": "Registered or principal place of business.", "validation": {"minLength": 10, "maxLength": 180}},
          {"key": "customerRepresentative", "label": "Customer representative", "type": "text", "required": true, "placeholder": "Aidar Sarsembayev", "helperText": "Authorized representative of the customer.", "validation": {"minLength": 3, "maxLength": 80}},
          {"key": "contractorCompany", "label": "Service provider company", "type": "text", "required": true, "placeholder": "LLP BuildTech Engineering", "helperText": "Legal name of the service provider.", "validation": {"minLength": 3, "maxLength": 120}},
          {"key": "contractorAddress", "label": "Service provider address", "type": "text", "required": true, "placeholder": "25 Satpayev Street, Almaty, Kazakhstan", "helperText": "Registered or principal place of business.", "validation": {"minLength": 10, "maxLength": 180}},
          {"key": "contractorRepresentative", "label": "Service provider representative", "type": "text", "required": true, "placeholder": "Arman Aliyev", "helperText": "Authorized representative of the service provider.", "validation": {"minLength": 3, "maxLength": 80}}
        ]
      },
      {
        "key": "scope",
        "title": "Scope of work",
        "description": "Describe the service in business terms without rewriting the agreement.",
        "fields": [
          {"key": "projectName", "label": "Project name", "type": "text", "required": true, "placeholder": "Business Center Facade Upgrade", "helperText": "Commercial project title.", "validation": {"minLength": 4, "maxLength": 120}},
          {"key": "serviceDescription", "label": "Services to be provided", "type": "text", "required": true, "placeholder": "Preparation of working drawings, site supervision, quality inspections, and monthly progress reporting for facade installation and finishing works.", "helperText": "Concise summary of the services.", "validation": {"minLength": 30, "maxLength": 500}},
          {"key": "deliverables", "label": "Main deliverables", "type": "text", "required": true, "placeholder": "Approved drawings, weekly inspection notes, monthly progress reports, and final handover package.", "helperText": "List what the customer receives.", "validation": {"minLength": 20, "maxLength": 300}},
          {"key": "serviceLocation", "label": "Service location", "type": "text", "required": true, "placeholder": "Almaty, Kazakhstan", "helperText": "Location where services are rendered or managed.", "validation": {"minLength": 3, "maxLength": 120}}
        ]
      },
      {
        "key": "dates",
        "title": "Dates and term",
        "description": "Set the commercial schedule and review period.",
        "fields": [
          {"key": "startDate", "label": "Service start date", "type": "date", "required": true, "helperText": "Date performance starts.", "defaultValue": "2026-04-15"},
          {"key": "endDate", "label": "Service end date", "type": "date", "required": true, "helperText": "Target completion date.", "defaultValue": "2026-09-30"},
          {"key": "acceptancePeriodDays", "label": "Acceptance review period", "type": "select", "required": true, "helperText": "Customer review period for submitted deliverables.", "defaultValue": "5", "options": [
            {"value": "3", "label": "3 calendar days"},
            {"value": "5", "label": "5 calendar days"},
            {"value": "10", "label": "10 calendar days"}
          ]}
        ]
      },
      {
        "key": "payment",
        "title": "Payment and amounts",
        "description": "Use structured payment controls with standard defaults.",
        "fields": [
          {"key": "contractAmount", "label": "Contract amount", "type": "money", "required": true, "helperText": "Base contract value before any optional VAT clause.", "defaultValue": 12500000, "validation": {"minValue": 1, "maxValue": 1000000000}},
          {"key": "currency", "label": "Currency", "type": "select", "required": true, "helperText": "Primary contract currency.", "defaultValue": "KZT", "options": [
            {"value": "KZT", "label": "Kazakhstani tenge (KZT)"},
            {"value": "USD", "label": "US dollar (USD)"}
          ]},
          {"key": "paymentTerms", "label": "Payment terms", "type": "select", "required": true, "helperText": "Closest standard commercial pattern.", "defaultValue": "Monthly based on accepted services", "options": [
            {"value": "Monthly based on accepted services", "label": "Monthly based on accepted services"},
            {"value": "30% advance and 70% after final acceptance", "label": "30% advance and 70% after final acceptance"},
            {"value": "100% after final acceptance", "label": "100% after final acceptance"}
          ]},
          {"key": "invoiceDueDays", "label": "Invoice due period", "type": "select", "required": true, "helperText": "Time allowed for invoice payment.", "defaultValue": "10", "options": [
            {"value": "5", "label": "5 business days"},
            {"value": "10", "label": "10 business days"},
            {"value": "15", "label": "15 business days"}
          ]}
        ]
      },
      {
        "key": "optionalClauses",
        "title": "Optional clauses",
        "description": "Turn standard legal clauses on or off.",
        "fields": [
          {"key": "includeConfidentialityClause", "label": "Include confidentiality clause", "type": "boolean", "helperText": "Protects commercial and technical information.", "defaultValue": true},
          {"key": "includePenaltyClause", "label": "Include delay penalty clause", "type": "boolean", "helperText": "Adds a daily penalty for delay.", "defaultValue": true},
          {"key": "penaltyRate", "label": "Penalty rate per day", "type": "text", "required": true, "visibleWhen": "includePenaltyClause", "placeholder": "0.1% of the delayed amount", "helperText": "Commercial wording inserted into the clause.", "defaultValue": "0.1% of the delayed amount", "validation": {"minLength": 3, "maxLength": 60}},
          {"key": "includeVatClause", "label": "Include VAT clause", "type": "boolean", "helperText": "States whether VAT is charged in addition to the price.", "defaultValue": true},
          {"key": "vatRate", "label": "VAT rate", "type": "select", "required": true, "visibleWhen": "includeVatClause", "helperText": "Shown only when VAT is enabled.", "defaultValue": "12%", "options": [
            {"value": "12%", "label": "12%"},
            {"value": "0%", "label": "0%"}
          ]},
          {"key": "includeGoverningLawClause", "label": "Include governing law clause", "type": "boolean", "helperText": "Specifies applicable law and venue.", "defaultValue": true},
          {"key": "governingLaw", "label": "Governing law and venue", "type": "text", "required": true, "visibleWhen": "includeGoverningLawClause", "helperText": "Legal wording used in the governing law clause.", "defaultValue": "the laws of the Republic of Kazakhstan, with disputes submitted to the courts of Almaty", "validation": {"minLength": 20, "maxLength": 180}},
          {"key": "includeAutoRenewalClause", "label": "Include auto-renewal clause", "type": "boolean", "helperText": "Extends the agreement automatically unless terminated.", "defaultValue": false},
          {"key": "renewalTermMonths", "label": "Renewal period", "type": "select", "required": true, "visibleWhen": "includeAutoRenewalClause", "helperText": "Shown only when auto-renewal is enabled.", "defaultValue": "12", "options": [
            {"value": "6", "label": "6 months"},
            {"value": "12", "label": "12 months"},
            {"value": "24", "label": "24 months"}
          ]}
        ]
      },
      {
        "key": "signatories",
        "title": "Signatory details",
        "description": "These values are inserted directly into the signature block.",
        "fields": [
          {"key": "customerSignatoryTitle", "label": "Customer signatory title", "type": "text", "required": true, "placeholder": "General Director", "helperText": "Title of the customer signatory.", "defaultValue": "General Director", "validation": {"minLength": 3, "maxLength": 80}},
          {"key": "contractorSignatoryTitle", "label": "Service provider signatory title", "type": "text", "required": true, "placeholder": "Director", "helperText": "Title of the service provider signatory.", "defaultValue": "Director", "validation": {"minLength": 3, "maxLength": 80}}
        ]
      }
    ]$$,
    $$[
      {"title": "Service Agreement", "blocks": [
        {"type": "heading", "content": "Service Agreement"},
        {"type": "paragraph", "content": "This Service Agreement (the \"Agreement\") is made and entered into on {{agreementDate}} by and between {{customerCompany}}, having its registered address at {{customerAddress}} and represented by {{customerRepresentative}} (the \"Customer\"), and {{contractorCompany}}, having its registered address at {{contractorAddress}} and represented by {{contractorRepresentative}} (the \"Service Provider\"). The Customer and the Service Provider may each be referred to herein as a \"Party\" and together as the \"Parties\"."},
        {"type": "paragraph", "content": "The Parties agree that the Service Provider shall perform services for the project \"{{projectName}}\" at {{serviceLocation}} on the terms set out below."}
      ]},
      {"title": "1. Scope of Services", "blocks": [
        {"type": "paragraph", "content": "1.1 The Service Provider shall provide the following services: {{serviceDescription}}."},
        {"type": "paragraph", "content": "1.2 The main deliverables under this Agreement are: {{deliverables}}."},
        {"type": "paragraph", "content": "1.3 The Service Provider shall perform the services with due skill, care, and diligence customary for experienced professional service providers."}
      ]},
      {"title": "2. Term and Acceptance", "blocks": [
        {"type": "paragraph", "content": "2.1 This Agreement shall commence on {{startDate}} and remain in force until {{endDate}}, unless terminated earlier in accordance with this Agreement."},
        {"type": "paragraph", "content": "2.2 The Customer shall review deliverables within {{acceptancePeriodDays}} calendar days after receipt and either accept them or provide written comments requiring correction."}
      ]},
      {"title": "3. Contract Price and Payment", "blocks": [
        {"type": "paragraph", "content": "3.1 The contract price for the services is {{contractAmount}} {{currency}}."},
        {"type": "paragraph", "content": "3.2 Payment shall be made as follows: {{paymentTerms}}."},
        {"type": "paragraph", "content": "3.3 The Customer shall pay each undisputed invoice within {{invoiceDueDays}} business days after receipt of a proper invoice and the corresponding acceptance documents."},
        {"type": "paragraph", "content": "3.4 VAT shall be charged additionally at the rate of {{vatRate}} in accordance with applicable tax legislation.", "visibleWhen": "includeVatClause"},
        {"type": "paragraph", "content": "3.4 No VAT is charged separately and the contract price is deemed final for settlement purposes.", "visibleWhen": "!includeVatClause"}
      ]},
      {"title": "4. Rights and Obligations", "blocks": [
        {"type": "list", "items": [
          "The Service Provider shall allocate sufficient qualified personnel and resources to perform the services.",
          "The Service Provider shall comply with applicable laws, regulations, and reasonable site procedures of the Customer.",
          "The Customer shall provide timely access to information, approvals, and premises reasonably required for performance.",
          "Each Party shall cooperate in good faith to enable the proper execution of this Agreement."
        ]}
      ]},
      {"title": "5. Confidentiality", "visibleWhen": "includeConfidentialityClause", "blocks": [
        {"type": "paragraph", "content": "5.1 Each Party shall keep confidential all non-public commercial, technical, financial, and operational information received from the other Party in connection with this Agreement and shall use such information solely for the purposes of performing this Agreement."},
        {"type": "paragraph", "content": "5.2 This confidentiality obligation shall survive termination or expiration of this Agreement for three (3) years."}
      ]},
      {"title": "6. Liability", "blocks": [
        {"type": "paragraph", "content": "6.1 Each Party shall be liable for non-performance or improper performance of its obligations under this Agreement in accordance with applicable law."},
        {"type": "paragraph", "content": "6.2 If the Service Provider delays performance through its own fault, it shall pay the Customer a penalty of {{penaltyRate}} for each day of delay.", "visibleWhen": "includePenaltyClause"}
      ]},
      {"title": "7. Governing Law and Renewal", "blocks": [
        {"type": "paragraph", "content": "7.1 This Agreement shall be governed by and construed in accordance with {{governingLaw}}.", "visibleWhen": "includeGoverningLawClause"},
        {"type": "paragraph", "content": "7.2 Upon expiry of the initial term, this Agreement shall automatically renew for successive periods of {{renewalTermMonths}} months unless either Party gives written notice of non-renewal not later than thirty (30) calendar days before the end of the current term.", "visibleWhen": "includeAutoRenewalClause"},
        {"type": "paragraph", "content": "7.3 Any amendment or waiver shall be valid only if made in writing and signed by both Parties."}
      ]},
      {"title": "8. Signatures", "blocks": [
        {"type": "paragraph", "content": "IN WITNESS WHEREOF, the Parties have caused this Agreement to be executed by their duly authorized representatives on the date first written above."},
        {"type": "paragraph", "content": "For the Customer: {{customerCompany}}"},
        {"type": "paragraph", "content": "Name: {{customerRepresentative}} | Title: {{customerSignatoryTitle}} | Signature: ____________________"},
        {"type": "paragraph", "content": "For the Service Provider: {{contractorCompany}}"},
        {"type": "paragraph", "content": "Name: {{contractorRepresentative}} | Title: {{contractorSignatoryTitle}} | Signature: ____________________"}
      ]}
    ]$$,
    NOW(),
    NOW()
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    is_active = EXCLUDED.is_active,
    is_system = EXCLUDED.is_system,
    schema_json = EXCLUDED.schema_json,
    layout_json = EXCLUDED.layout_json,
    updated_at = NOW();

INSERT INTO public.document_constructor_documents (
    template_id,
    owner_user_id,
    title,
    status,
    template_name_snapshot,
    template_version_snapshot,
    form_data_json,
    rendered_html,
    validation_errors_json,
    created_at,
    updated_at
)
SELECT
    template.id,
    18,
    'Service Agreement - Demo Draft',
    'VALIDATED',
    'Service Agreement',
    2,
    $${
      "agreementDate": "2026-04-11",
      "customerCompany": "LLP SmartQurylys Development",
      "customerAddress": "16 Abylai Khan Avenue, Almaty, Kazakhstan",
      "customerRepresentative": "Aidar Sarsembayev",
      "contractorCompany": "LLP BuildTech Engineering",
      "contractorAddress": "25 Satpayev Street, Almaty, Kazakhstan",
      "contractorRepresentative": "Arman Aliyev",
      "projectName": "Business Center Facade Upgrade",
      "serviceDescription": "Preparation of working drawings, site supervision, quality inspections, and monthly progress reporting for facade installation and finishing works.",
      "deliverables": "Approved drawings, weekly inspection notes, monthly progress reports, and final handover package.",
      "serviceLocation": "Almaty, Kazakhstan",
      "startDate": "2026-04-15",
      "endDate": "2026-09-30",
      "acceptancePeriodDays": "5",
      "contractAmount": 12500000,
      "currency": "KZT",
      "paymentTerms": "Monthly based on accepted services",
      "invoiceDueDays": "10",
      "includeConfidentialityClause": true,
      "includePenaltyClause": true,
      "penaltyRate": "0.1% of the delayed amount",
      "includeVatClause": true,
      "vatRate": "12%",
      "includeGoverningLawClause": true,
      "governingLaw": "the laws of the Republic of Kazakhstan, with disputes submitted to the courts of Almaty",
      "includeAutoRenewalClause": false,
      "renewalTermMonths": "12",
      "customerSignatoryTitle": "General Director",
      "contractorSignatoryTitle": "Director"
    }$$,
    $$<article class="dc-document"><header class="dc-document__header"><p class="dc-document__eyebrow">Template-first business document</p><h1>Service Agreement</h1></header><section class="dc-document__section"><h2>Service Agreement</h2><h1>Service Agreement</h1><p>This Service Agreement (the &quot;Agreement&quot;) is made and entered into on <span class="dc-editable" data-field="agreementDate">2026-04-11</span> by and between <span class="dc-editable" data-field="customerCompany">LLP SmartQurylys Development</span>, having its registered address at <span class="dc-editable" data-field="customerAddress">16 Abylai Khan Avenue, Almaty, Kazakhstan</span> and represented by <span class="dc-editable" data-field="customerRepresentative">Aidar Sarsembayev</span> (the &quot;Customer&quot;), and <span class="dc-editable" data-field="contractorCompany">LLP BuildTech Engineering</span>, having its registered address at <span class="dc-editable" data-field="contractorAddress">25 Satpayev Street, Almaty, Kazakhstan</span> and represented by <span class="dc-editable" data-field="contractorRepresentative">Arman Aliyev</span> (the &quot;Service Provider&quot;). The Customer and the Service Provider may each be referred to herein as a &quot;Party&quot; and together as the &quot;Parties&quot;.</p><p>The Parties agree that the Service Provider shall perform services for the project &quot;<span class="dc-editable" data-field="projectName">Business Center Facade Upgrade</span>&quot; at <span class="dc-editable" data-field="serviceLocation">Almaty, Kazakhstan</span> on the terms set out below.</p></section><section class="dc-document__section"><h2>1. Scope of Services</h2><p>1.1 The Service Provider shall provide the following services: <span class="dc-editable" data-field="serviceDescription">Preparation of working drawings, site supervision, quality inspections, and monthly progress reporting for facade installation and finishing works.</span>.</p><p>1.2 The main deliverables under this Agreement are: <span class="dc-editable" data-field="deliverables">Approved drawings, weekly inspection notes, monthly progress reports, and final handover package.</span>.</p><p>1.3 The Service Provider shall perform the services with due skill, care, and diligence customary for experienced professional service providers.</p></section><section class="dc-document__section"><h2>2. Term and Acceptance</h2><p>2.1 This Agreement shall commence on <span class="dc-editable" data-field="startDate">2026-04-15</span> and remain in force until <span class="dc-editable" data-field="endDate">2026-09-30</span>, unless terminated earlier in accordance with this Agreement.</p><p>2.2 The Customer shall review deliverables within <span class="dc-editable" data-field="acceptancePeriodDays">5</span> calendar days after receipt and either accept them or provide written comments requiring correction.</p></section><section class="dc-document__section"><h2>3. Contract Price and Payment</h2><p>3.1 The contract price for the services is <span class="dc-editable" data-field="contractAmount">12,500,000.00 KZT</span> <span class="dc-editable" data-field="currency">KZT</span>.</p><p>3.2 Payment shall be made as follows: <span class="dc-editable" data-field="paymentTerms">Monthly based on accepted services</span>.</p><p>3.3 The Customer shall pay each undisputed invoice within <span class="dc-editable" data-field="invoiceDueDays">10</span> business days after receipt of a proper invoice and the corresponding acceptance documents.</p><p>3.4 VAT shall be charged additionally at the rate of <span class="dc-editable" data-field="vatRate">12%</span> in accordance with applicable tax legislation.</p></section><section class="dc-document__section"><h2>4. Rights and Obligations</h2><ul><li>The Service Provider shall allocate sufficient qualified personnel and resources to perform the services.</li><li>The Service Provider shall comply with applicable laws, regulations, and reasonable site procedures of the Customer.</li><li>The Customer shall provide timely access to information, approvals, and premises reasonably required for performance.</li><li>Each Party shall cooperate in good faith to enable the proper execution of this Agreement.</li></ul></section><section class="dc-document__section"><h2>5. Confidentiality</h2><p>5.1 Each Party shall keep confidential all non-public commercial, technical, financial, and operational information received from the other Party in connection with this Agreement and shall use such information solely for the purposes of performing this Agreement.</p><p>5.2 This confidentiality obligation shall survive termination or expiration of this Agreement for three (3) years.</p></section><section class="dc-document__section"><h2>6. Liability</h2><p>6.1 Each Party shall be liable for non-performance or improper performance of its obligations under this Agreement in accordance with applicable law.</p><p>6.2 If the Service Provider delays performance through its own fault, it shall pay the Customer a penalty of <span class="dc-editable" data-field="penaltyRate">0.1% of the delayed amount</span> for each day of delay.</p></section><section class="dc-document__section"><h2>7. Governing Law and Renewal</h2><p>7.1 This Agreement shall be governed by and construed in accordance with <span class="dc-editable" data-field="governingLaw">the laws of the Republic of Kazakhstan, with disputes submitted to the courts of Almaty</span>.</p><p>7.3 Any amendment or waiver shall be valid only if made in writing and signed by both Parties.</p></section><section class="dc-document__section"><h2>8. Signatures</h2><p>IN WITNESS WHEREOF, the Parties have caused this Agreement to be executed by their duly authorized representatives on the date first written above.</p><p>For the Customer: <span class="dc-editable" data-field="customerCompany">LLP SmartQurylys Development</span></p><p>Name: <span class="dc-editable" data-field="customerRepresentative">Aidar Sarsembayev</span> | Title: <span class="dc-editable" data-field="customerSignatoryTitle">General Director</span> | Signature: ____________________</p><p>For the Service Provider: <span class="dc-editable" data-field="contractorCompany">LLP BuildTech Engineering</span></p><p>Name: <span class="dc-editable" data-field="contractorRepresentative">Arman Aliyev</span> | Title: <span class="dc-editable" data-field="contractorSignatoryTitle">Director</span> | Signature: ____________________</p></section></article>$$,
    '[]',
    NOW(),
    NOW()
FROM public.document_constructor_templates template
WHERE template.code = 'construction-service-agreement'
  AND EXISTS (SELECT 1 FROM public.users WHERE id = 18)
  AND NOT EXISTS (
      SELECT 1
      FROM public.document_constructor_documents existing
      WHERE existing.template_id = template.id
        AND existing.owner_user_id = 18
        AND existing.title = 'Service Agreement - Demo Draft'
  );
