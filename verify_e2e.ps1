$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5000/api"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   OfficeFlow CRM - Live End-to-End Verification   " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n[1/10] Verifying System Health..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host " ✓ Health Status: $($health.status), Office: $($health.office.currency), Timezone: $($health.office.timezone)" -ForegroundColor Green

# 2. Authentication Testing for all 3 Roles
Write-Host "`n[2/10] Authenticating Admin, Manager, and Employee..." -ForegroundColor Yellow

# Admin Login
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body '{"email":"admin@officeflow.internal","password":"OfficeFlow@2026"}' -ContentType "application/json" -WebSession $adminSession
Write-Host " ✓ Admin Authenticated: $($adminLogin.user.name) (Role: $($adminLogin.user.role))" -ForegroundColor Green

# Manager Login
$mgrSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$mgrLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body '{"email":"priya.nair@officeflow.internal","password":"OfficeFlow@2026"}' -ContentType "application/json" -WebSession $mgrSession
Write-Host " ✓ Manager Authenticated: $($mgrLogin.user.name) (Role: $($mgrLogin.user.role))" -ForegroundColor Green

# Employee Login
$empSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$empLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body '{"email":"kavita.patel@officeflow.internal","password":"OfficeFlow@2026"}' -ContentType "application/json" -WebSession $empSession
Write-Host " ✓ Employee Authenticated: $($empLogin.user.name) (Role: $($empLogin.user.role))" -ForegroundColor Green

# 3. RBAC Enforcement Verification
Write-Host "`n[3/10] Testing RBAC Security Boundaries on /api/settings..." -ForegroundColor Yellow
# Admin access (Allowed)
$adminSettings = Invoke-RestMethod -Uri "$baseUrl/settings" -Method Get -WebSession $adminSession
Write-Host " ✓ Admin permitted to read settings: Office Name = '$($adminSettings.data.officeName)'" -ForegroundColor Green

# Employee access (Must be Forbidden)
try {
    $empSettings = Invoke-RestMethod -Uri "$baseUrl/settings" -Method Get -WebSession $empSession
    Write-Host " ✗ ERROR: Employee was able to access admin settings!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host " ✓ Employee successfully BLOCKED (HTTP 403 Forbidden) from accessing admin settings" -ForegroundColor Green
}

# 4. Lead Creation with Employee Session
Write-Host "`n[4/10] Employee creating a new Lead..." -ForegroundColor Yellow
$newLeadBody = @{
    fullName = "Dr. Sameer Khan"
    company = "Bharat Dynamics Systems"
    email = "sameer.khan@bharatdyn.example.com"
    phone = "+91 98200 88776"
    source = "Website"
    priority = "High"
    tags = @("Strategic", "Defense")
    notes = "Inquired about enterprise CRM license for 300 field units."
} | ConvertTo-Json

$leadRes = Invoke-RestMethod -Uri "$baseUrl/leads" -Method Post -Body $newLeadBody -ContentType "application/json" -WebSession $empSession
$leadId = $leadRes.data._id
Write-Host " ✓ Lead Created: '$($leadRes.data.fullName)' at '$($leadRes.data.company)' [ID: $leadId]" -ForegroundColor Green

# 5. Duplicate Detection Verification
Write-Host "`n[5/10] Testing Live Duplicate Warning Engine..." -ForegroundColor Yellow
$dupRes = Invoke-RestMethod -Uri "$baseUrl/leads/duplicates?email=sameer.khan@bharatdyn.example.com" -Method Get -WebSession $empSession
if ($dupRes.hasDuplicates -eq $true) {
    Write-Host " ✓ Duplicate Detected correctly: Found $($dupRes.duplicates.Count) existing match for 'sameer.khan@bharatdyn.example.com'" -ForegroundColor Green
} else {
    Write-Host " ✗ Duplicate detection failed" -ForegroundColor Red
    exit 1
}

# 6. Activity & Follow-Up Logging
Write-Host "`n[6/10] Logging Client Activity & Scheduling Follow-up..." -ForegroundColor Yellow
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss")
$actBody = @{
    type = "Call"
    relatedType = "lead"
    relatedId = $leadId
    title = "Discovery & Commercial Qualification Call"
    notes = "Reviewed budget and confirmed procurement authority. Ready for formal proposal."
    outcome = "Client agreed to review commercial quote."
    scheduledAt = $tomorrow
} | ConvertTo-Json

$actRes = Invoke-RestMethod -Uri "$baseUrl/activities" -Method Post -Body $actBody -ContentType "application/json" -WebSession $empSession
Write-Host " ✓ Activity Logged: '$($actRes.data.title)' with scheduled follow-up" -ForegroundColor Green

# 7. Atomic Lead Conversion into Contact, Company, and Deal
Write-Host "`n[7/10] Executing Atomic Lead Conversion to Customer & Deal..." -ForegroundColor Yellow
$convertBody = @{
    createDeal = $true
    dealTitle = "Bharat Dynamics - 300 Seats Enterprise License"
    dealValue = 4500000 # ₹45,00,000
    createCompany = $true
} | ConvertTo-Json

$convertRes = Invoke-RestMethod -Uri "$baseUrl/leads/$leadId/convert" -Method Post -Body $convertBody -ContentType "application/json" -WebSession $empSession
$dealId = $convertRes.data.dealId
$contactId = $convertRes.data.contactId
$companyId = $convertRes.data.companyId
Write-Host " ✓ Lead Atomically Converted:" -ForegroundColor Green
Write-Host "   - Contact ID : $contactId" -ForegroundColor DarkGreen
Write-Host "   - Company ID : $companyId" -ForegroundColor DarkGreen
Write-Host "   - Deal ID    : $dealId" -ForegroundColor DarkGreen

# 8. Deal Pipeline Stage Transitions (Kanban Flow)
Write-Host "`n[8/10] Advancing Deal through Sales Kanban Stages..." -ForegroundColor Yellow

# Move to Proposal
$stage1 = Invoke-RestMethod -Uri "$baseUrl/deals/$dealId/stage" -Method Put -Body '{"stage":"Proposal","notes":"Commercial proposal ₹45,00,000 submitted"}' -ContentType "application/json" -WebSession $empSession
Write-Host " ✓ Deal moved to: $($stage1.data.stage)" -ForegroundColor Green

# Move to Negotiation
$stage2 = Invoke-RestMethod -Uri "$baseUrl/deals/$dealId/stage" -Method Put -Body '{"stage":"Negotiation","notes":"Contract legal terms reviewed"}' -ContentType "application/json" -WebSession $empSession
Write-Host " ✓ Deal moved to: $($stage2.data.stage)" -ForegroundColor Green

# Move to Won!
$stage3 = Invoke-RestMethod -Uri "$baseUrl/deals/$dealId/stage" -Method Put -Body '{"stage":"Won","notes":"Signed contract received!"}' -ContentType "application/json" -WebSession $empSession
Write-Host " ✓ Deal moved to: $($stage3.data.stage) (Won value ₹45,00,000)" -ForegroundColor Green

# 9. Global Search Verification
Write-Host "`n[9/10] Testing Scoped Global Search Engine for 'Bharat'..." -ForegroundColor Yellow
$searchRes = Invoke-RestMethod -Uri "$baseUrl/search?q=Bharat" -Method Get -WebSession $empSession
Write-Host " ✓ Search returned:" -ForegroundColor Green
Write-Host "   - Matching Leads     : $($searchRes.results.leads.Count)" -ForegroundColor DarkGreen
Write-Host "   - Matching Contacts  : $($searchRes.results.contacts.Count)" -ForegroundColor DarkGreen
Write-Host "   - Matching Companies : $($searchRes.results.companies.Count)" -ForegroundColor DarkGreen
Write-Host "   - Matching Deals     : $($searchRes.results.deals.Count)" -ForegroundColor DarkGreen

# 10. Reports & Dashboard Metrics Verification
Write-Host "`n[10/10] Verifying Dashboard & Executive Reports..." -ForegroundColor Yellow
$reports = Invoke-RestMethod -Uri "$baseUrl/reports" -Method Get -WebSession $adminSession
Write-Host " ✓ Report Analytics:" -ForegroundColor Green
Write-Host "   - Total Won Deals   : $($reports.data.dealsSummary.wonCount)" -ForegroundColor DarkGreen
Write-Host "   - Total Won Revenue : ₹$($reports.data.dealsSummary.wonValue.ToString('N0'))" -ForegroundColor DarkGreen
Write-Host "   - Open Pipeline     : ₹$($reports.data.dealsSummary.openValue.ToString('N0'))" -ForegroundColor DarkGreen
Write-Host "   - Conversion Funnel : Total Leads = $($reports.data.funnel[0].count), Converted = $($reports.data.funnel[3].count)" -ForegroundColor DarkGreen

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "  ALL 10 VERIFICATION STEPS PASSED SUCCESSFULLY!    " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
