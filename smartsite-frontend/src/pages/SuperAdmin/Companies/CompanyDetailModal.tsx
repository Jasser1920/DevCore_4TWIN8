import { Modal } from '../../../components/shared/UI'
import { X } from 'lucide-react'
import { Status } from '../../../components/shared/UI'

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

interface CompanyDetailModalProps {
  company: Company | null
  onClose: () => void
  directorName?: string
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CompanyDetailModal({ company, onClose, directorName }: CompanyDetailModalProps) {
  if (!company) return null

  return (
    <Modal isOpen={true} onClose={onClose} title="">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '600px'
      }}>
        {/* Header with title and close button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0
          }}>
            Company Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '20px'
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Company Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Company Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Company Name
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1a1a1a',
              fontWeight: '500'
            }}>
              {company.name}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Description
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1a1a1a',
              lineHeight: '1.5',
              minHeight: '60px'
            }}>
              {company.description || '-'}
            </div>
          </div>

          {/* Contact Information Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Contact Name
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1a1a1a'
              }}>
                {company.contactName}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Contact Email
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1a1a1a',
                overflowWrap: 'break-word'
              }}>
                {company.contactEmail}
              </div>
            </div>
          </div>

          {/* Status and Director Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Status
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Status
                  type={company.status === 'ACTIVE' ? 'success' : 'error'}
                  label={company.status}
                  size="small"
                  icon={true}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Director
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1a1a1a'
              }}>
                {directorName || 'N/A'}
              </div>
            </div>
          </div>

          {/* Created Date */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Created Date
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1a1a1a'
            }}>
              {formatDate(company.createdAt)}
            </div>
          </div>

          {/* Updated Date */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Last Updated
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1a1a1a'
            }}>
              {formatDate(company.updatedAt)}
            </div>
          </div>

          {/* Company ID */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Company ID
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'monospace',
              overflowWrap: 'break-word'
            }}>
              {company.id}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
