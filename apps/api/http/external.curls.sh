#!/usr/bin/env bash
# curl equivalents of external.http
# Substitua FORM_ID / OWN_FORM_ID pelos valores reais (o http-client.env.json que os definia foi removido).

BASE_URL="https://dev-api.collectshare.com.br"
API_KEY="cs_sk_a795239f61fb384c104fd5e49a1ecaa6e7030c8a8589dfde1dabe4db2e376357"
FORM_ID="3JfGk1xlKr5suGCax2sh83LynTJ"
OWN_FORM_ID="3JfGk1xlKr5suGCax2sh83LynTJ"

# 1. Get published dataset raw data — first page
curl -sS -X GET "$BASE_URL/v1/portal/datasets/$FORM_ID/data?limit=5" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 2. Get published dataset raw data — next page (copy nextCursor from #1's response)
curl -sS -X GET "$BASE_URL/v1/portal/datasets/$FORM_ID/data?limit=5&cursor=PASTE_NEXT_CURSOR_HERE" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 3. Get published dataset raw data — limit clamped to MAX_LIMIT (1000) when exceeded
curl -sS -X GET "$BASE_URL/v1/portal/datasets/$FORM_ID/data?limit=5000" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 4. Get published dataset raw data — unknown/unpublished form (expect 404)
curl -sS -X GET "$BASE_URL/v1/portal/datasets/this-form-does-not-exist/data" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 5. Get published dataset raw data — key without portal:read scope (expect 405 NotAllowedError)
curl -sS -X GET "$BASE_URL/v1/portal/datasets/$FORM_ID/data" \
  -H "x-api-key: PASTE_A_FORMS_READ_ONLY_KEY_HERE" \
  -H "Accept: application/json"

# 6. Get published dataset raw data — missing API key (expect 401 from the authorizer)
curl -sS -X GET "$BASE_URL/v1/portal/datasets/$FORM_ID/data" \
  -H "Accept: application/json"

# 7. Get published dataset raw data — malformed key, wrong prefix (expect 401)
curl -sS -X GET "$BASE_URL/v1/portal/datasets/$FORM_ID/data" \
  -H "x-api-key: not-a-valid-key" \
  -H "Accept: application/json"

# 8. Get own submission data — first page
curl -sS -X GET "$BASE_URL/v1/submissions/$OWN_FORM_ID?limit=5" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 9. Get own submission data — next page (copy nextCursor from #8's response)
curl -sS -X GET "$BASE_URL/v1/submissions/$OWN_FORM_ID?limit=5&cursor=PASTE_NEXT_CURSOR_HERE" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 10. Get own submission data — limit clamped to MAX_LIMIT (1000) when exceeded
curl -sS -X GET "$BASE_URL/v1/submissions/$OWN_FORM_ID?limit=5000" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 11. Get own submission data — unknown form (expect 404)
curl -sS -X GET "$BASE_URL/v1/submissions/this-form-does-not-exist" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 12. Get own submission data — form belongs to a different account (expect 405 NotAllowedError)
curl -sS -X GET "$BASE_URL/v1/submissions/PASTE_A_FORM_ID_OWNED_BY_ANOTHER_ACCOUNT_HERE" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 13. Get own submission data — key without forms:read scope (expect 405 NotAllowedError)
curl -sS -X GET "$BASE_URL/v1/submissions/$OWN_FORM_ID" \
  -H "x-api-key: PASTE_A_PORTAL_READ_ONLY_KEY_HERE" \
  -H "Accept: application/json"

# 14. Get own submission data — missing API key (expect 401 from the authorizer)
curl -sS -X GET "$BASE_URL/v1/submissions/$OWN_FORM_ID" \
  -H "Accept: application/json"

# 15. List own forms
curl -sS -X GET "$BASE_URL/v1/forms" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 16. List own forms — key without forms:read scope (expect 405 NotAllowedError)
curl -sS -X GET "$BASE_URL/v1/forms" \
  -H "x-api-key: PASTE_A_PORTAL_READ_ONLY_KEY_HERE" \
  -H "Accept: application/json"

# 17. List own forms — missing API key (expect 401 from the authorizer)
curl -sS -X GET "$BASE_URL/v1/forms" \
  -H "Accept: application/json"

# 18. Search datasets
curl -sS -X GET "$BASE_URL/v1/portal/search?q=rain" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 19. Search datasets — no query term
curl -sS -X GET "$BASE_URL/v1/portal/search" \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json"

# 20. Search datasets — key without portal:read scope (expect 405 NotAllowedError)
curl -sS -X GET "$BASE_URL/v1/portal/search?q=rain" \
  -H "x-api-key: PASTE_A_FORMS_READ_ONLY_KEY_HERE" \
  -H "Accept: application/json"

# 21. Search datasets — missing API key (expect 401 from the authorizer)
curl -sS -X GET "$BASE_URL/v1/portal/search?q=rain" \
  -H "Accept: application/json"

# 22. Create a form
curl -sS -X POST "$BASE_URL/v1/forms" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Pesquisa de satisfação", "isAnonymous": true, "onePage": false, "isPublished": true}'

# 23. Create a form — missing required title (expect 400 Bad Request)
curl -sS -X POST "$BASE_URL/v1/forms" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"isAnonymous": true, "onePage": false, "isPublished": true}'

# 24. Create a form — key without forms:write scope (expect 405 NotAllowedError)
curl -sS -X POST "$BASE_URL/v1/forms" \
  -H "x-api-key: PASTE_A_FORMS_READ_ONLY_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title": "Pesquisa de satisfação"}'

# 25. Create a form — missing API key (expect 401 from the authorizer)
curl -sS -X POST "$BASE_URL/v1/forms" \
  -H "Content-Type: application/json" \
  -d '{"title": "Pesquisa de satisfação"}'

# 26. Update a form's details — WARNING: mutates $OWN_FORM_ID, point it at a disposable form
curl -sS -X PUT "$BASE_URL/v1/forms/$OWN_FORM_ID" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Pesquisa de satisfação (atualizada)", "isAnonymous": true, "onePage": false, "isPublished": true}'

# 27. Update a form's details — form does not exist (expect 404 Not Found)
curl -sS -X PUT "$BASE_URL/v1/forms/this-form-does-not-exist" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Pesquisa de satisfação", "isAnonymous": true, "onePage": false, "isPublished": true}'

# 28. Update a form's details — form belongs to a different account (expect 405 NotAllowedError)
curl -sS -X PUT "$BASE_URL/v1/forms/PASTE_A_FORM_ID_OWNED_BY_ANOTHER_ACCOUNT_HERE" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Pesquisa de satisfação", "isAnonymous": true, "onePage": false, "isPublished": true}'

# 29. Update a form's details — key without forms:write scope (expect 405 NotAllowedError)
curl -sS -X PUT "$BASE_URL/v1/forms/$OWN_FORM_ID" \
  -H "x-api-key: PASTE_A_FORMS_READ_ONLY_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title": "Pesquisa de satisfação", "isAnonymous": true, "onePage": false, "isPublished": true}'

# 30. Update a form's details — invalid body, missing title (expect 400 Bad Request)
curl -sS -X PUT "$BASE_URL/v1/forms/$OWN_FORM_ID" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"isAnonymous": true, "onePage": false, "isPublished": true}'

# 31. Update a form's details — missing API key (expect 401 from the authorizer)
curl -sS -X PUT "$BASE_URL/v1/forms/$OWN_FORM_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Pesquisa de satisfação"}'

# 32. Replace a form's questions — WARNING: mutates $OWN_FORM_ID, deletes any question not listed here
curl -sS -X PUT "$BASE_URL/v1/forms/$OWN_FORM_ID/questions" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"questions": [{"text": "Qual sua idade?", "questionType": "TEXT", "order": 1}]}'

# 33. Replace a form's questions — empty questions array (expect 400 Bad Request)
curl -sS -X PUT "$BASE_URL/v1/forms/$OWN_FORM_ID/questions" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"questions": []}'

# 34. Replace a form's questions — form does not exist (expect 404 Not Found)
curl -sS -X PUT "$BASE_URL/v1/forms/this-form-does-not-exist/questions" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"questions": [{"text": "Qual sua idade?", "questionType": "TEXT", "order": 1}]}'

# 35. Replace a form's questions — form belongs to a different account (expect 405 NotAllowedError)
curl -sS -X PUT "$BASE_URL/v1/forms/PASTE_A_FORM_ID_OWNED_BY_ANOTHER_ACCOUNT_HERE/questions" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"questions": [{"text": "Qual sua idade?", "questionType": "TEXT", "order": 1}]}'

# 36. Replace a form's questions — key without forms:write scope (expect 405 NotAllowedError)
curl -sS -X PUT "$BASE_URL/v1/forms/$OWN_FORM_ID/questions" \
  -H "x-api-key: PASTE_A_FORMS_READ_ONLY_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"questions": [{"text": "Qual sua idade?", "questionType": "TEXT", "order": 1}]}'

# 37. Replace a form's questions — missing API key (expect 401 from the authorizer)
curl -sS -X PUT "$BASE_URL/v1/forms/$OWN_FORM_ID/questions" \
  -H "Content-Type: application/json" \
  -d '{"questions": [{"text": "Qual sua idade?", "questionType": "TEXT", "order": 1}]}'
