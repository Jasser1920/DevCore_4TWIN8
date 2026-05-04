import { useEffect, useState } from 'react'
import { Button, Table, Status } from '../../../components/shared/UI'
import { useCompanies } from './useCompanies'
import EditCompanyModal from './EditCompanyModal'
import CompanyDetailModal from './CompanyDetailModal'
import { exportCompaniesToPDF } from '../../../lib/pdfExport'
import { Download, Edit, Trash } from 'lucide-react'

interface Company {
  id: string
  name: string
  description: string
  contactEmail: string
  contactName: string
  managerUserId: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Director {
  id: string
  firstName: string
  lastName: string
  isEmailVerified: boolean
}

export default function CompaniesList() {
  const { companies, isLoading, deleteCompany, directors } = useCompanies()
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const handleExportCompanies = () => {
    const companiesWithDirector = companies.map((company: Company) => ({
      ...company,
      directorName: getDirectorName(company.managerUserId)
    }))

    exportCompaniesToPDF(companiesWithDirector)
  }

  const handleDelete = (company: Company) => {
    if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
      deleteCompany(company.id)
    }
  }

  // Find director name for a company
  const getDirectorName = (managerUserId: string) => {
    const director = directors.find((d: Director) => d.id === managerUserId)
    if (director) {
      return `${director.firstName} ${director.lastName}`
    }
    return 'N/A'
  }

  const getSuspensionDeadline = (company: Company) => {
    if (company.status !== 'SUSPENDED' || !company.updatedAt) {
      return null
    }

    return new Date(new Date(company.updatedAt).getTime() + 3 * 24 * 60 * 60 * 1000)
  }

  const getCountdownText = (company: Company) => {
    const deadline = getSuspensionDeadline(company)

    if (!deadline) {
      return null
    }

    const remainingMs = deadline.getTime() - now

    if (remainingMs <= 0) {
      return 'Deleting now...'
    }

    const totalSeconds = Math.floor(remainingMs / 1000)
    const days = Math.floor(totalSeconds / (24 * 60 * 60))
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${days}d ${hours}h ${minutes}m ${seconds}s left`
  }

  const columns = [
    { 
      key: 'name' as const, 
      label: 'Company Name',
      render: (company: Company) => company.name
    },
    { 
      key: 'contactName' as const, 
      label: 'Contact',
      render: (company: Company) => (
        <div>
          <div style={{ fontWeight: '500' }}>{company.contactName}</div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>{company.contactEmail}</div>
        </div>
      )
    },
    { 
      key: 'managerUserId' as const, 
      label: 'Director',
      render: (company: Company) => getDirectorName(company.managerUserId)
    },
    { 
      key: 'status' as const, 
      label: 'Status',
      render: (company: Company) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Status
            type={company.status === 'ACTIVE' ? 'success' : 'error'}
            label={company.status}
            size="small"
            icon={true}
          />
          {company.status === 'SUSPENDED' && (
            <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: '500' }}>
              {getCountdownText(company)}
            </span>
          )}
        </div>
      )
    },
  ]

  const actions = [
    {
      label: 'Edit',
      icon: Edit,
      onClick: (company: Company) => setEditingCompany(company),
      variant: 'primary' as const,
      shouldShow: (company: Company) => company.status !== 'SUSPENDED'
    },
    {
      label: 'Delete',
      icon: Trash,
      onClick: handleDelete,
      variant: 'danger' as const,
      shouldShow: (company: Company) => company.status !== 'SUSPENDED'
    }
  ]

  return (
    <>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            fontFamily: 'Poppins, sans-serif'
          }}>
            All Companies
          </h3>
          <Button
            onClick={handleExportCompanies}
            disabled={companies.length === 0}
            title={companies.length === 0 ? 'No companies to export' : 'Export all companies to PDF'}
            icon={Download}
          >
            Export to PDF
          </Button>
        </div>
        
        <Table
          columns={columns}
          data={companies}
          actions={actions}
          onRowClick={(company) => setSelectedCompany(company)}
          loading={isLoading}
          emptyMessage="No companies found. Create your first company above."
          getRowKey={(company) => company.id}
        />
      </div>

      {selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          directorName={getDirectorName(selectedCompany.managerUserId)}
        />
      )}

      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
        />
      )}
    </>
  )
}
