UPDATE public.document_constructor_templates
SET
    schema_json = $$[
      {"key":"parties","title":"Стороны","description":"Проверьте юридические стороны договора и их представителей.","fields":[
        {"key":"agreementDate","label":"Дата договора","type":"date","required":true,"helperText":"Дата подписания договора.","defaultValue":"2026-04-11"},
        {"key":"customerCompany","label":"Компания заказчика","type":"text","required":true,"placeholder":"ТОО SmartQurylys Development","helperText":"Полное юридическое наименование заказчика.","defaultValue":"ТОО SmartQurylys Development","validation":{"minLength":3,"maxLength":120}},
        {"key":"customerAddress","label":"Адрес заказчика","type":"text","required":true,"placeholder":"проспект Абылай Хана, 16, Алматы, Казахстан","helperText":"Юридический или основной адрес деятельности заказчика.","defaultValue":"проспект Абылай Хана, 16, Алматы, Казахстан","validation":{"minLength":10,"maxLength":180}},
        {"key":"customerRepresentative","label":"Представитель заказчика","type":"text","required":true,"placeholder":"Айдар Сарсембаев","helperText":"Уполномоченный представитель заказчика.","defaultValue":"Айдар Сарсембаев","validation":{"minLength":3,"maxLength":80}},
        {"key":"contractorCompany","label":"Компания исполнителя","type":"text","required":true,"placeholder":"ТОО BuildTech Engineering","helperText":"Полное юридическое наименование исполнителя.","defaultValue":"ТОО BuildTech Engineering","validation":{"minLength":3,"maxLength":120}},
        {"key":"contractorAddress","label":"Адрес исполнителя","type":"text","required":true,"placeholder":"улица Сатпаева, 25, Алматы, Казахстан","helperText":"Юридический или основной адрес деятельности исполнителя.","defaultValue":"улица Сатпаева, 25, Алматы, Казахстан","validation":{"minLength":10,"maxLength":180}},
        {"key":"contractorRepresentative","label":"Представитель исполнителя","type":"text","required":true,"placeholder":"Арман Алиев","helperText":"Уполномоченный представитель исполнителя.","defaultValue":"Арман Алиев","validation":{"minLength":3,"maxLength":80}}
      ]},
      {"key":"scope","title":"Предмет и объём услуг","description":"Опишите услуги в деловой форме без переписывания договора вручную.","fields":[
        {"key":"projectName","label":"Название проекта","type":"text","required":true,"placeholder":"Модернизация фасада бизнес-центра","helperText":"Коммерческое наименование проекта.","defaultValue":"Модернизация фасада бизнес-центра","validation":{"minLength":4,"maxLength":120}},
        {"key":"serviceDescription","label":"Перечень услуг","type":"text","required":true,"placeholder":"Разработка рабочей документации, авторский надзор, контроль качества и ежемесячная отчётность по фасадным и отделочным работам.","helperText":"Краткое и понятное описание услуг.","defaultValue":"Разработка рабочей документации, авторский надзор, контроль качества и ежемесячная отчётность по фасадным и отделочным работам.","validation":{"minLength":30,"maxLength":500}},
        {"key":"deliverables","label":"Основные результаты","type":"text","required":true,"placeholder":"Утверждённые чертежи, еженедельные акты осмотра, ежемесячные отчёты о ходе работ и итоговый комплект исполнительной документации.","helperText":"Что именно получает заказчик.","defaultValue":"Утверждённые чертежи, еженедельные акты осмотра, ежемесячные отчёты о ходе работ и итоговый комплект исполнительной документации.","validation":{"minLength":20,"maxLength":300}},
        {"key":"serviceLocation","label":"Место оказания услуг","type":"text","required":true,"placeholder":"Алматы, Казахстан","helperText":"Локация, где оказываются или координируются услуги.","defaultValue":"Алматы, Казахстан","validation":{"minLength":3,"maxLength":120}}
      ]},
      {"key":"dates","title":"Сроки","description":"Укажите период оказания услуг и срок проверки результатов.","fields":[
        {"key":"startDate","label":"Дата начала услуг","type":"date","required":true,"helperText":"Дата начала исполнения обязательств.","defaultValue":"2026-04-15"},
        {"key":"endDate","label":"Дата окончания услуг","type":"date","required":true,"helperText":"Плановая дата завершения работ.","defaultValue":"2026-09-30"},
        {"key":"acceptancePeriodDays","label":"Срок проверки результатов","type":"select","required":true,"helperText":"Срок для рассмотрения переданных результатов заказчиком.","defaultValue":"5","options":[
          {"value":"3","label":"3 календарных дня"},
          {"value":"5","label":"5 календарных дней"},
          {"value":"10","label":"10 календарных дней"}
        ]}
      ]},
      {"key":"payment","title":"Стоимость и оплата","description":"Используйте структурированные поля оплаты со стандартными значениями.","fields":[
        {"key":"contractAmount","label":"Сумма договора","type":"money","required":true,"helperText":"Базовая стоимость договора до учёта дополнительного НДС.","defaultValue":12500000,"validation":{"minValue":1,"maxValue":1000000000}},
        {"key":"currency","label":"Валюта расчётов","type":"select","required":true,"helperText":"Основная валюта договора.","defaultValue":"KZT","options":[
          {"value":"KZT","label":"Казахстанский тенге (KZT)"},
          {"value":"USD","label":"Доллар США (USD)"}
        ]},
        {"key":"paymentTerms","label":"Условия оплаты","type":"select","required":true,"helperText":"Выберите наиболее подходящую коммерческую схему.","defaultValue":"Ежемесячно по факту принятых услуг","options":[
          {"value":"Ежемесячно по факту принятых услуг","label":"Ежемесячно по факту принятых услуг"},
          {"value":"30% авансом и 70% после итоговой приёмки","label":"30% авансом и 70% после итоговой приёмки"},
          {"value":"100% после итоговой приёмки","label":"100% после итоговой приёмки"}
        ]},
        {"key":"invoiceDueDays","label":"Срок оплаты счёта","type":"select","required":true,"helperText":"Период, отведённый на оплату счёта.","defaultValue":"10","options":[
          {"value":"5","label":"5 рабочих дней"},
          {"value":"10","label":"10 рабочих дней"},
          {"value":"15","label":"15 рабочих дней"}
        ]}
      ]},
      {"key":"optionalClauses","title":"Дополнительные условия","description":"Включайте или отключайте стандартные юридические положения.","fields":[
        {"key":"includeConfidentialityClause","label":"Включить условие о конфиденциальности","type":"boolean","helperText":"Защищает коммерческую и техническую информацию.","defaultValue":true},
        {"key":"includePenaltyClause","label":"Включить неустойку за просрочку","type":"boolean","helperText":"Добавляет ежедневную неустойку при просрочке.","defaultValue":true},
        {"key":"penaltyRate","label":"Размер неустойки в день","type":"text","required":true,"visibleWhen":"includePenaltyClause","placeholder":"0,1% от суммы просроченного обязательства","helperText":"Формулировка будет вставлена в текст договора.","defaultValue":"0,1% от суммы просроченного обязательства","validation":{"minLength":3,"maxLength":60}},
        {"key":"includeVatClause","label":"Включить условие о НДС","type":"boolean","helperText":"Указывает, начисляется ли НДС сверх цены договора.","defaultValue":true},
        {"key":"vatRate","label":"Ставка НДС","type":"select","required":true,"visibleWhen":"includeVatClause","helperText":"Показывается только при включённом НДС.","defaultValue":"12%","options":[
          {"value":"12%","label":"12%"},
          {"value":"0%","label":"0%"}
        ]},
        {"key":"includeGoverningLawClause","label":"Включить применимое право","type":"boolean","helperText":"Определяет применимое право и подсудность.","defaultValue":true},
        {"key":"governingLaw","label":"Применимое право и подсудность","type":"text","required":true,"visibleWhen":"includeGoverningLawClause","helperText":"Юридическая формулировка для соответствующего пункта договора.","defaultValue":"законодательством Республики Казахстан, а споры подлежат рассмотрению в судах города Алматы","validation":{"minLength":20,"maxLength":180}},
        {"key":"includeAutoRenewalClause","label":"Включить автоматическое продление","type":"boolean","helperText":"Продлевает договор автоматически, если стороны не заявят об отказе.","defaultValue":false},
        {"key":"renewalTermMonths","label":"Срок продления","type":"select","required":true,"visibleWhen":"includeAutoRenewalClause","helperText":"Показывается только при включённом автоматическом продлении.","defaultValue":"12","options":[
          {"value":"6","label":"6 месяцев"},
          {"value":"12","label":"12 месяцев"},
          {"value":"24","label":"24 месяца"}
        ]}
      ]},
      {"key":"signatories","title":"Подписанты","description":"Эти значения вставляются в блок подписей.","fields":[
        {"key":"customerSignatoryTitle","label":"Должность подписанта заказчика","type":"text","required":true,"placeholder":"Генеральный директор","helperText":"Должность подписанта со стороны заказчика.","defaultValue":"Генеральный директор","validation":{"minLength":3,"maxLength":80}},
        {"key":"contractorSignatoryTitle","label":"Должность подписанта исполнителя","type":"text","required":true,"placeholder":"Директор","helperText":"Должность подписанта со стороны исполнителя.","defaultValue":"Директор","validation":{"minLength":3,"maxLength":80}}
      ]}
    ]$$,
    layout_json = $$[
      {"title":"Договор оказания услуг","blocks":[
        {"type":"heading","content":"Договор оказания услуг"},
        {"type":"paragraph","content":"Настоящий Договор оказания услуг (далее - «Договор») заключён {{agreementDate}} между {{customerCompany}}, зарегистрированным по адресу: {{customerAddress}}, в лице {{customerRepresentative}}, действующего от имени заказчика (далее - «Заказчик»), и {{contractorCompany}}, зарегистрированным по адресу: {{contractorAddress}}, в лице {{contractorRepresentative}}, действующего от имени исполнителя (далее - «Исполнитель»). Заказчик и Исполнитель совместно именуются «Стороны», а по отдельности - «Сторона»."},
        {"type":"paragraph","content":"Стороны договорились о том, что Исполнитель оказывает услуги по проекту «{{projectName}}» на объекте или территории {{serviceLocation}} на условиях, изложенных в настоящем Договоре."}
      ]},
      {"title":"1. Предмет договора","blocks":[
        {"type":"paragraph","content":"1.1 Исполнитель обязуется оказать Заказчику следующие услуги: {{serviceDescription}}."},
        {"type":"paragraph","content":"1.2 Основными результатами оказания услуг по настоящему Договору являются: {{deliverables}}."},
        {"type":"paragraph","content":"1.3 Исполнитель оказывает услуги добросовестно, квалифицированно и с уровнем профессиональной заботливости, обычно требуемым от опытных поставщиков аналогичных услуг."}
      ]},
      {"title":"2. Срок действия и приёмка","blocks":[
        {"type":"paragraph","content":"2.1 Настоящий Договор вступает в силу с {{startDate}} и действует до {{endDate}}, если не будет прекращён ранее в соответствии с его условиями."},
        {"type":"paragraph","content":"2.2 Заказчик обязан рассмотреть переданные результаты в течение {{acceptancePeriodDays}} календарных дней с даты их получения и либо принять их, либо направить Исполнителю письменные замечания для устранения."}
      ]},
      {"title":"3. Стоимость услуг и порядок оплаты","blocks":[
        {"type":"paragraph","content":"3.1 Общая стоимость услуг по настоящему Договору составляет {{contractAmount}} {{currency}}."},
        {"type":"paragraph","content":"3.2 Оплата производится на следующих условиях: {{paymentTerms}}."},
        {"type":"paragraph","content":"3.3 Заказчик оплачивает каждый бесспорный счёт в течение {{invoiceDueDays}} рабочих дней после получения надлежащим образом оформленного счёта и соответствующих документов о приёмке."},
        {"type":"paragraph","content":"3.4 НДС начисляется дополнительно по ставке {{vatRate}} в соответствии с применимым налоговым законодательством.","visibleWhen":"includeVatClause"},
        {"type":"paragraph","content":"3.4 НДС отдельно не начисляется, и стоимость договора считается окончательной для целей расчётов.","visibleWhen":"!includeVatClause"}
      ]},
      {"title":"4. Права и обязанности сторон","blocks":[
        {"type":"list","items":[
          "Исполнитель обязан привлечь достаточное количество квалифицированного персонала и ресурсов для надлежащего оказания услуг.",
          "Исполнитель обязан соблюдать применимое законодательство, нормативные требования и разумные правила Заказчика, действующие на объекте.",
          "Заказчик обязан своевременно предоставлять информацию, согласования и доступ к объектам и помещениям, необходимые для оказания услуг.",
          "Каждая из Сторон обязуется добросовестно сотрудничать для надлежащего исполнения настоящего Договора."
        ]}
      ]},
      {"title":"5. Конфиденциальность","visibleWhen":"includeConfidentialityClause","blocks":[
        {"type":"paragraph","content":"5.1 Каждая Сторона обязуется сохранять конфиденциальность всей непубличной коммерческой, технической, финансовой и операционной информации, полученной от другой Стороны в связи с исполнением настоящего Договора, и использовать такую информацию исключительно в целях исполнения настоящего Договора."},
        {"type":"paragraph","content":"5.2 Обязанность по соблюдению конфиденциальности сохраняет силу в течение трёх (3) лет после прекращения или истечения срока действия настоящего Договора."}
      ]},
      {"title":"6. Ответственность сторон","blocks":[
        {"type":"paragraph","content":"6.1 Каждая Сторона несёт ответственность за неисполнение или ненадлежащее исполнение своих обязательств по настоящему Договору в соответствии с применимым законодательством."},
        {"type":"paragraph","content":"6.2 В случае просрочки исполнения обязательств по вине Исполнителя он уплачивает Заказчику неустойку в размере {{penaltyRate}} за каждый день просрочки.","visibleWhen":"includePenaltyClause"}
      ]},
      {"title":"7. Применимое право и продление","blocks":[
        {"type":"paragraph","content":"7.1 Настоящий Договор регулируется и толкуется в соответствии с {{governingLaw}}.","visibleWhen":"includeGoverningLawClause"},
        {"type":"paragraph","content":"7.2 По истечении первоначального срока действия настоящий Договор автоматически продлевается на каждый последующий период продолжительностью {{renewalTermMonths}} месяцев, если ни одна из Сторон не направит письменное уведомление об отказе от продления не позднее чем за тридцать (30) календарных дней до окончания текущего срока.","visibleWhen":"includeAutoRenewalClause"},
        {"type":"paragraph","content":"7.3 Любые изменения, дополнения и отказы от прав по настоящему Договору действительны только при их письменном оформлении и подписании обеими Сторонами."}
      ]},
      {"title":"8. Подписи сторон","blocks":[
        {"type":"paragraph","content":"В удостоверение вышеизложенного Стороны обеспечили подписание настоящего Договора своими надлежащим образом уполномоченными представителями в дату, указанную в его преамбуле."},
        {"type":"paragraph","content":"Заказчик: {{customerCompany}}"},
        {"type":"paragraph","content":"ФИО: {{customerRepresentative}} | Должность: {{customerSignatoryTitle}} | Подпись: ____________________"},
        {"type":"paragraph","content":"Исполнитель: {{contractorCompany}}"},
        {"type":"paragraph","content":"ФИО: {{contractorRepresentative}} | Должность: {{contractorSignatoryTitle}} | Подпись: ____________________"}
      ]}
    ]$$,
    updated_at = NOW()
WHERE code = 'construction-service-agreement';

UPDATE public.document_constructor_documents d
SET
    form_data_json = $${
      "agreementDate":"2026-04-11",
      "customerCompany":"ТОО SmartQurylys Development",
      "customerAddress":"проспект Абылай Хана, 16, Алматы, Казахстан",
      "customerRepresentative":"Айдар Сарсембаев",
      "contractorCompany":"ТОО BuildTech Engineering",
      "contractorAddress":"улица Сатпаева, 25, Алматы, Казахстан",
      "contractorRepresentative":"Арман Алиев",
      "projectName":"Модернизация фасада бизнес-центра",
      "serviceDescription":"Разработка рабочей документации, авторский надзор, контроль качества и ежемесячная отчётность по фасадным и отделочным работам.",
      "deliverables":"Утверждённые чертежи, еженедельные акты осмотра, ежемесячные отчёты о ходе работ и итоговый комплект исполнительной документации.",
      "serviceLocation":"Алматы, Казахстан",
      "startDate":"2026-04-15",
      "endDate":"2026-09-30",
      "acceptancePeriodDays":"5",
      "contractAmount":12500000,
      "currency":"KZT",
      "paymentTerms":"Ежемесячно по факту принятых услуг",
      "invoiceDueDays":"10",
      "includeConfidentialityClause":true,
      "includePenaltyClause":true,
      "penaltyRate":"0,1% от суммы просроченного обязательства",
      "includeVatClause":true,
      "vatRate":"12%",
      "includeGoverningLawClause":true,
      "governingLaw":"законодательством Республики Казахстан, а споры подлежат рассмотрению в судах города Алматы",
      "includeAutoRenewalClause":false,
      "renewalTermMonths":"12",
      "customerSignatoryTitle":"Генеральный директор",
      "contractorSignatoryTitle":"Директор"
    }$$,
    rendered_html = $$<article class="dc-document"><header class="dc-document__header"><p class="dc-document__eyebrow">Template-first business document</p><h1>Договор оказания услуг</h1></header><section class="dc-document__section"><h2>Договор оказания услуг</h2><h1>Договор оказания услуг</h1><p>Настоящий Договор оказания услуг (далее - «Договор») заключён <span class="dc-editable" data-field="agreementDate">2026-04-11</span> между <span class="dc-editable" data-field="customerCompany">ТОО SmartQurylys Development</span>, зарегистрированным по адресу: <span class="dc-editable" data-field="customerAddress">проспект Абылай Хана, 16, Алматы, Казахстан</span>, в лице <span class="dc-editable" data-field="customerRepresentative">Айдар Сарсембаев</span>, действующего от имени заказчика (далее - «Заказчик»), и <span class="dc-editable" data-field="contractorCompany">ТОО BuildTech Engineering</span>, зарегистрированным по адресу: <span class="dc-editable" data-field="contractorAddress">улица Сатпаева, 25, Алматы, Казахстан</span>, в лице <span class="dc-editable" data-field="contractorRepresentative">Арман Алиев</span>, действующего от имени исполнителя (далее - «Исполнитель»). Заказчик и Исполнитель совместно именуются «Стороны», а по отдельности - «Сторона».</p><p>Стороны договорились о том, что Исполнитель оказывает услуги по проекту «<span class="dc-editable" data-field="projectName">Модернизация фасада бизнес-центра</span>» на объекте или территории <span class="dc-editable" data-field="serviceLocation">Алматы, Казахстан</span> на условиях, изложенных в настоящем Договоре.</p></section><section class="dc-document__section"><h2>1. Предмет договора</h2><p>1.1 Исполнитель обязуется оказать Заказчику следующие услуги: <span class="dc-editable" data-field="serviceDescription">Разработка рабочей документации, авторский надзор, контроль качества и ежемесячная отчётность по фасадным и отделочным работам.</span>.</p><p>1.2 Основными результатами оказания услуг по настоящему Договору являются: <span class="dc-editable" data-field="deliverables">Утверждённые чертежи, еженедельные акты осмотра, ежемесячные отчёты о ходе работ и итоговый комплект исполнительной документации.</span>.</p><p>1.3 Исполнитель оказывает услуги добросовестно, квалифицированно и с уровнем профессиональной заботливости, обычно требуемым от опытных поставщиков аналогичных услуг.</p></section><section class="dc-document__section"><h2>2. Срок действия и приёмка</h2><p>2.1 Настоящий Договор вступает в силу с <span class="dc-editable" data-field="startDate">2026-04-15</span> и действует до <span class="dc-editable" data-field="endDate">2026-09-30</span>, если не будет прекращён ранее в соответствии с его условиями.</p><p>2.2 Заказчик обязан рассмотреть переданные результаты в течение <span class="dc-editable" data-field="acceptancePeriodDays">5</span> календарных дней с даты их получения и либо принять их, либо направить Исполнителю письменные замечания для устранения.</p></section><section class="dc-document__section"><h2>3. Стоимость услуг и порядок оплаты</h2><p>3.1 Общая стоимость услуг по настоящему Договору составляет <span class="dc-editable" data-field="contractAmount">12,500,000.00 KZT</span> <span class="dc-editable" data-field="currency">KZT</span>.</p><p>3.2 Оплата производится на следующих условиях: <span class="dc-editable" data-field="paymentTerms">Ежемесячно по факту принятых услуг</span>.</p><p>3.3 Заказчик оплачивает каждый бесспорный счёт в течение <span class="dc-editable" data-field="invoiceDueDays">10</span> рабочих дней после получения надлежащим образом оформленного счёта и соответствующих документов о приёмке.</p><p>3.4 НДС начисляется дополнительно по ставке <span class="dc-editable" data-field="vatRate">12%</span> в соответствии с применимым налоговым законодательством.</p></section><section class="dc-document__section"><h2>4. Права и обязанности сторон</h2><ul><li>Исполнитель обязан привлечь достаточное количество квалифицированного персонала и ресурсов для надлежащего оказания услуг.</li><li>Исполнитель обязан соблюдать применимое законодательство, нормативные требования и разумные правила Заказчика, действующие на объекте.</li><li>Заказчик обязан своевременно предоставлять информацию, согласования и доступ к объектам и помещениям, необходимые для оказания услуг.</li><li>Каждая из Сторон обязуется добросовестно сотрудничать для надлежащего исполнения настоящего Договора.</li></ul></section><section class="dc-document__section"><h2>5. Конфиденциальность</h2><p>5.1 Каждая Сторона обязуется сохранять конфиденциальность всей непубличной коммерческой, технической, финансовой и операционной информации, полученной от другой Стороны в связи с исполнением настоящего Договора, и использовать такую информацию исключительно в целях исполнения настоящего Договора.</p><p>5.2 Обязанность по соблюдению конфиденциальности сохраняет силу в течение трёх (3) лет после прекращения или истечения срока действия настоящего Договора.</p></section><section class="dc-document__section"><h2>6. Ответственность сторон</h2><p>6.1 Каждая Сторона несёт ответственность за неисполнение или ненадлежащее исполнение своих обязательств по настоящему Договору в соответствии с применимым законодательством.</p><p>6.2 В случае просрочки исполнения обязательств по вине Исполнителя он уплачивает Заказчику неустойку в размере <span class="dc-editable" data-field="penaltyRate">0,1% от суммы просроченного обязательства</span> за каждый день просрочки.</p></section><section class="dc-document__section"><h2>7. Применимое право и продление</h2><p>7.1 Настоящий Договор регулируется и толкуется в соответствии с <span class="dc-editable" data-field="governingLaw">законодательством Республики Казахстан, а споры подлежат рассмотрению в судах города Алматы</span>.</p><p>7.3 Любые изменения, дополнения и отказы от прав по настоящему Договору действительны только при их письменном оформлении и подписании обеими Сторонами.</p></section><section class="dc-document__section"><h2>8. Подписи сторон</h2><p>В удостоверение вышеизложенного Стороны обеспечили подписание настоящего Договора своими надлежащим образом уполномоченными представителями в дату, указанную в его преамбуле.</p><p>Заказчик: <span class="dc-editable" data-field="customerCompany">ТОО SmartQurylys Development</span></p><p>ФИО: <span class="dc-editable" data-field="customerRepresentative">Айдар Сарсембаев</span> | Должность: <span class="dc-editable" data-field="customerSignatoryTitle">Генеральный директор</span> | Подпись: ____________________</p><p>Исполнитель: <span class="dc-editable" data-field="contractorCompany">ТОО BuildTech Engineering</span></p><p>ФИО: <span class="dc-editable" data-field="contractorRepresentative">Арман Алиев</span> | Должность: <span class="dc-editable" data-field="contractorSignatoryTitle">Директор</span> | Подпись: ____________________</p></section></article>$$,
    validation_errors_json = '[]',
    updated_at = NOW()
FROM public.document_constructor_templates t
WHERE d.template_id = t.id
  AND t.code = 'construction-service-agreement';
