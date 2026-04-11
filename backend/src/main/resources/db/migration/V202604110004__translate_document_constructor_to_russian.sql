UPDATE public.document_constructor_templates
SET
    name = 'Договор оказания услуг',
    category = 'Договоры',
    description = 'Практичный договор оказания услуг для строительных и инженерных работ с дополнительными юридическими условиями и готовыми формулировками.',
    version = GREATEST(COALESCE(version, 1), 3),
    updated_at = NOW()
WHERE code = 'construction-service-agreement';

UPDATE public.document_constructor_documents d
SET
    title = CASE
        WHEN d.title = 'Service Agreement - Demo Draft' THEN 'Договор оказания услуг - демо'
        ELSE d.title
    END,
    template_name_snapshot = 'Договор оказания услуг',
    template_version_snapshot = GREATEST(COALESCE(d.template_version_snapshot, 1), 3),
    updated_at = NOW()
FROM public.document_constructor_templates t
WHERE d.template_id = t.id
  AND t.code = 'construction-service-agreement';
