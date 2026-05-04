import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Client from './Client'

const apiMocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getClientProjects: vi.fn(),
  getClientMilestoneValidationQueue: vi.fn(),
  getProjectMilestones: vi.fn(),
  validateMilestoneByClient: vi.fn(),
  getClientMilestoneDecisionHistory: vi.fn(),
  resolveApiUrl: vi.fn((path: string) => `http://localhost:3000${path}`),
}))

const authMocks = vi.hoisted(() => ({
  clearTokens: vi.fn(),
  getAccessToken: vi.fn(() => 'token'),
  getRefreshToken: vi.fn(() => 'refresh'),
  getRolesFromToken: vi.fn(() => ['CLIENT']),
  getBusinessRoles: vi.fn(() => ['CLIENT']),
  getSubjectFromToken: vi.fn(() => 'client-1'),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ search: '?view=milestone-requests' }),
}))

vi.mock('../hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: false, isTablet: false, isDesktop: true, width: 1440 }),
}))

vi.mock('../contexts/AccessibilityContext', () => ({
  useAccessibility: () => ({ settings: { guidedTipsEnabled: false } }),
}))

vi.mock('../components/LoadingPage', () => ({
  default: () => null,
}))

vi.mock('../components/shared/Sidebar', () => ({
  default: ({ navItems, currentPage, onPageChange }: any) => (
    <div>
      {navItems.map((item: any) => (
        <button
          key={item.id}
          data-testid={`nav-${item.id}`}
          data-active={currentPage === item.id}
          onClick={() => onPageChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('../components/shared/AccessibilitySettingsPanel', () => ({
  default: () => <div>Accessibility Settings</div>,
}))

vi.mock('../components/shared/GuidedTourOverlay', () => ({
  default: () => null,
}))

vi.mock('../components/shared/FloatingTutorialButton', () => ({
  default: () => null,
}))

vi.mock('../components/NotificationsPanel', () => ({
  default: () => <div>Notifications</div>,
}))

vi.mock('../lib/auth', () => ({
  clearTokens: authMocks.clearTokens,
  getAccessToken: authMocks.getAccessToken,
  getRefreshToken: authMocks.getRefreshToken,
  getRolesFromToken: authMocks.getRolesFromToken,
  getBusinessRoles: authMocks.getBusinessRoles,
  getSubjectFromToken: authMocks.getSubjectFromToken,
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual('../lib/api')
  return {
    ...actual,
    apiFetch: apiMocks.apiFetch,
    getClientProjects: apiMocks.getClientProjects,
    getClientMilestoneValidationQueue: apiMocks.getClientMilestoneValidationQueue,
    getProjectMilestones: apiMocks.getProjectMilestones,
    validateMilestoneByClient: apiMocks.validateMilestoneByClient,
    getClientMilestoneDecisionHistory: apiMocks.getClientMilestoneDecisionHistory,
    resolveApiUrl: apiMocks.resolveApiUrl,
  }
})

function renderClientPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <Client />
    </QueryClientProvider>,
  )
}

describe('Client Request Page', () => {
  beforeEach(() => {
    apiMocks.apiFetch.mockReset()
    apiMocks.getClientProjects.mockReset()
    apiMocks.getClientMilestoneValidationQueue.mockReset()
    apiMocks.getProjectMilestones.mockReset()
    apiMocks.validateMilestoneByClient.mockReset()
    apiMocks.getClientMilestoneDecisionHistory.mockReset()
    apiMocks.validateMilestoneByClient.mockResolvedValue({
      id: 'm-pending',
      status: 'APPROVED_BY_CLIENT',
    })

    apiMocks.getClientProjects.mockResolvedValue([
      {
        id: 'project-1',
        name: 'Tower Project',
        status: 'ACTIVE',
        code: 'TW-01',
        currency: 'USD',
        budgetPlanned: 1000,
        budgetConsumed: 300,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      },
    ])

    apiMocks.getClientMilestoneValidationQueue.mockResolvedValue([
      {
        id: 'm-pending',
        projectId: 'project-1',
        name: 'Pending Milestone',
        status: 'SUBMITTED_FOR_CLIENT_VALIDATION',
        plannedDate: '2026-03-01',
        submittedAt: '2026-03-10',
        createdAt: '2026-03-10',
        updatedAt: '2026-03-10',
        evidenceSummary: 'Pending evidence',
        evidenceAttachments: ['/projects/uploads/evidence-1.pdf'],
      },
    ])

    apiMocks.getProjectMilestones.mockResolvedValue([
      {
        id: 'm-pending',
        projectId: 'project-1',
        name: 'Pending Milestone',
        status: 'SUBMITTED_FOR_CLIENT_VALIDATION',
        plannedDate: '2026-03-01',
        submittedAt: '2026-03-10',
        createdAt: '2026-03-10',
        updatedAt: '2026-03-10',
        evidenceSummary: 'Pending evidence',
        evidenceAttachments: ['/projects/uploads/evidence-1.pdf'],
      },
      {
        id: 'm-approved',
        projectId: 'project-1',
        name: 'Approved Milestone',
        status: 'APPROVED_BY_CLIENT',
        plannedDate: '2026-02-01',
        submittedAt: '2026-02-10',
        createdAt: '2026-02-10',
        updatedAt: '2026-02-15',
        evidenceSummary: 'Approved evidence',
        evidenceAttachments: [],
      },
    ])

    apiMocks.getClientMilestoneDecisionHistory.mockResolvedValue([])

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      configurable: true,
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['fake-pdf'], { type: 'application/pdf' }),
      }),
    )

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:mock-preview'),
      configurable: true,
    })

    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
    })

    Element.prototype.scrollIntoView = vi.fn()
  })

  it('shows approved milestones in the all milestones section', async () => {
    renderClientPage()

    expect(await screen.findByText('All Milestones')).toBeInTheDocument()
    expect(await screen.findByText('Approved Milestone')).toBeInTheDocument()
    expect(await screen.findByText('Approved by you')).toBeInTheDocument()
  })

  it('jumps from request panel to highlighted milestone card', async () => {
    renderClientPage()

    const requestItem = await screen.findByTitle('Jump to this milestone')
    fireEvent.click(requestItem)

    await waitFor(() => {
      const card = document.getElementById('milestone-card-m-pending')
      expect(card).not.toBeNull()
      expect(card?.getAttribute('style') || '').toContain('2px solid rgb(14, 116, 144)')
    })

    expect(screen.getByText('Back to Request Panel')).toBeInTheDocument()
  })

  it('opens attachment modal and closes with Escape', async () => {
    renderClientPage()

    const pendingCard = await waitFor(() => {
      const card = document.getElementById('milestone-card-m-pending')
      expect(card).not.toBeNull()
      return card as HTMLElement
    })

    const openButton = within(pendingCard).getByRole('button', { name: 'Open larger view' })
    fireEvent.click(openButton)

    expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    })
  })

  it('shows and clears request panel highlight badge', async () => {
    renderClientPage()

    const requestItem = await screen.findByTitle('Jump to this milestone')
    fireEvent.click(requestItem)

    expect(await screen.findByTitle('A milestone is currently highlighted')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Back to Request Panel'))

    await waitFor(() => {
      expect(screen.queryByTitle('A milestone is currently highlighted')).not.toBeInTheDocument()
    })

    fireEvent.click(requestItem)
    expect(await screen.findByTitle('A milestone is currently highlighted')).toBeInTheDocument()

    await waitFor(
      () => {
        expect(screen.queryByTitle('A milestone is currently highlighted')).not.toBeInTheDocument()
      },
      { timeout: 3200 },
    )
  })

  it('runs request-to-approval smoke flow', async () => {
    renderClientPage()

    const requestItem = await screen.findByTitle('Jump to this milestone')
    fireEvent.click(requestItem)

    const pendingCard = await waitFor(() => {
      const card = document.getElementById('milestone-card-m-pending')
      expect(card).not.toBeNull()
      return card as HTMLElement
    })

    const openButton = await waitFor(() =>
      within(pendingCard).getByRole('button', { name: 'Open larger view' }),
    )
    fireEvent.click(openButton)
    expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    })

    const approveButton = within(pendingCard).getByRole('button', { name: 'Approve' })
    fireEvent.click(approveButton)

    const confirmButton = await screen.findByRole('button', { name: 'Confirm decision' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(apiMocks.validateMilestoneByClient).toHaveBeenCalledWith('m-pending', {
        decision: 'APPROVE',
        comment: undefined,
      })
    })
  })

  it('shows fallback message and open-file link when attachment preview fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        blob: async () => new Blob(['broken'], { type: 'application/pdf' }),
      }),
    )

    renderClientPage()

    expect(await screen.findByText('Unable to load attachment preview')).toBeInTheDocument()

    const openFileLinks = screen.getAllByRole('link', { name: 'Open file' })
    expect(openFileLinks.length).toBeGreaterThan(0)
  })
})
