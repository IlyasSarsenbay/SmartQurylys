UPDATE public.document_constructor_templates
SET
    schema_json = jsonb_set(
        jsonb_set(
            jsonb_set(
                schema_json::jsonb,
                '{1,fields,1,type}',
                '"textarea"'::jsonb,
                false
            ),
            '{1,fields,2,type}',
            '"textarea"'::jsonb,
            false
        ),
        '{4,fields,6,type}',
        '"textarea"'::jsonb,
        false
    )::text,
    updated_at = NOW()
WHERE code = 'construction-service-agreement';
