import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isEmailVerified: boolean
  keycloakId?: string
}

interface Company {
  id: string
  name: string
  description: string
  contactEmail: string
  contactName: string
  managerUserId?: string
  directorName?: string
  status: string
  createdAt?: string
  storageQuota?: number
  usedStorage?: number
}

export const exportUsersToPDF = (users: User[]) => {
  if (users.length === 0) {
    alert('No users to export')
    return
  }

  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // Set document properties
  doc.setProperties({
    title: 'SmartSite - Users Report',
    author: 'SmartSite',
    subject: 'User Details Export'
  })

  // Add header
  doc.setFontSize(18)
  doc.setTextColor(7, 91, 122) // #075B7A color
  doc.text('SmartSite - User Details Report', 14, 20)

  // Add timestamp
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Generated on: ${exportDate}`, 14, 28)

  // Prepare table data
  const tableColumns = [
    { header: 'Username', dataKey: 'username' },
    { header: 'Email', dataKey: 'email' },
    { header: 'First Name', dataKey: 'firstName' },
    { header: 'Last Name', dataKey: 'lastName' },
    { header: 'Role', dataKey: 'role' },
    { header: 'Email Verified', dataKey: 'verified' }
  ]

  const tableData = users.map(user => ({
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    verified: user.isEmailVerified ? 'Yes' : 'No'
  }))

  // Add table using autoTable
  autoTable(doc, {
    columns: tableColumns,
    body: tableData,
    startY: 36,
    theme: 'grid',
    headStyles: {
      fillColor: [7, 91, 122],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3
    },
    bodyStyles: {
      textColor: [50, 50, 50],
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 247, 248]
    },
    margin: { top: 36, right: 14, left: 14, bottom: 14 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 }
    }
  })

  // Add footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  doc.save(`smartsite-users-${new Date().getTime()}.pdf`)
}

export const exportUserDetailsToPDF = (user: User) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Set document properties
  doc.setProperties({
    title: `SmartSite - ${user.username} Details`,
    author: 'SmartSite'
  })

  // Add header
  doc.setFontSize(18)
  doc.setTextColor(7, 91, 122)
  doc.text('SmartSite - User Details', 14, 20)

  // Add timestamp
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Generated on: ${exportDate}`, 14, 28)

  // Add separator line
  doc.setDrawColor(7, 91, 122)
  doc.line(14, 32, 196, 32)

  // Add user details
  let yPosition = 42

  const addField = (label: string, value: string) => {
    doc.setFontSize(11)
    doc.setTextColor(7, 91, 122)
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 14, yPosition)

    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, yPosition)

    yPosition += 10
  }

  addField('Username', user.username)
  addField('Email', user.email)
  addField('First Name', user.firstName)
  addField('Last Name', user.lastName)
  addField('Role', user.role)
  addField('Email Verified', user.isEmailVerified ? 'Yes' : 'No')
  if (user.keycloakId) {
    addField('User ID', user.keycloakId)
  }

  // Save the PDF
  doc.save(`smartsite-user-${user.username}-${new Date().getTime()}.pdf`)
}

export const exportCompaniesToPDF = (companies: Company[]) => {
  if (companies.length === 0) {
    alert('No companies to export')
    return
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  doc.setProperties({
    title: 'SmartSite - Companies Report',
    author: 'SmartSite',
    subject: 'Company Details Export'
  })

  doc.setFontSize(18)
  doc.setTextColor(7, 91, 122)
  doc.text('SmartSite - Companies Report', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Generated on: ${exportDate}`, 14, 28)

  autoTable(doc, {
    columns: [
      { header: 'Company Name', dataKey: 'name' },
      { header: 'Contact Name', dataKey: 'contactName' },
      { header: 'Contact Email', dataKey: 'contactEmail' },
      { header: 'Director', dataKey: 'directorName' },
      { header: 'Status', dataKey: 'status' }
    ],
    body: companies.map(company => ({
      name: company.name,
      contactName: company.contactName || 'N/A',
      contactEmail: company.contactEmail || 'N/A',
      directorName: company.directorName || 'N/A',
      status: company.status
    })),
    startY: 36,
    theme: 'grid',
    headStyles: {
      fillColor: [7, 91, 122],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3
    },
    bodyStyles: {
      textColor: [50, 50, 50],
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 247, 248]
    },
    margin: { top: 36, right: 14, left: 14, bottom: 14 }
  })

  const pageCount = (doc as any).internal.getNumberOfPages()
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  doc.save(`smartsite-companies-${new Date().getTime()}.pdf`)
}

export const exportCompanyDetailsToPDF = (company: Company) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  doc.setProperties({
    title: `SmartSite - ${company.name} Details`,
    author: 'SmartSite'
  })

  doc.setFontSize(18)
  doc.setTextColor(7, 91, 122)
  doc.text('SmartSite - Company Details', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Generated on: ${exportDate}`, 14, 28)

  doc.setDrawColor(7, 91, 122)
  doc.line(14, 32, 196, 32)

  let yPosition = 42

  const addField = (label: string, value: string) => {
    doc.setFontSize(11)
    doc.setTextColor(7, 91, 122)
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 14, yPosition)

    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, yPosition)

    yPosition += 10
  }

  addField('Company Name', company.name)
  addField('Status', company.status)
  addField('Contact Name', company.contactName || 'Not set')
  addField('Contact Email', company.contactEmail || 'Not set')
  addField('Director', company.directorName || 'N/A')

  if (company.storageQuota !== undefined) {
    addField('Storage Quota', `${(company.storageQuota / (1024 * 1024 * 1024)).toFixed(2)} GB`)
  }

  if (company.usedStorage !== undefined) {
    addField('Storage Used', `${(company.usedStorage / (1024 * 1024 * 1024)).toFixed(2)} GB`)
  }

  addField('Description', company.description || 'No description provided')

  doc.save(`smartsite-company-${company.name}-${new Date().getTime()}.pdf`)
}
