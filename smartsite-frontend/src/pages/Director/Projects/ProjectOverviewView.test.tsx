import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ProjectOverviewView from './ProjectOverviewView'

const apiMocks = vi.hoisted(() => ({
  getDirectorActiveProjectsOverview: vi.fn(),
  getDirectorProjectFinancialKpis: vi.fn(),
}))

vi.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: false, isTablet: false, isDesktop: true, width: 1440 }),
}))

vi.mock('../../../lib/api', async () => {
  const actual = await vi.importActual('../../../lib/api')
  return {
    ...actual,
    getDirectorActiveProjectsOverview: apiMocks.getDirectorActiveProjectsOverview,
    getDirectorProjectFinancialKpis: apiMocks.getDirectorProjectFinancialKpis,
  }
})

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectOverviewView />
    </QueryClientProvider>,
  )
}

describe('ProjectOverviewView', () => {
  beforeEach(() => {
    apiMocks.getDirectorActiveProjectsOverview.mockReset()
    apiMocks.getDirectorProjectFinancialKpis.mockReset()
  })

  it('shows loading state', () => {
    apiMocks.getDirectorActiveProjectsOverview.mockImplementation(
      () => new Promise(() => {}),
    )

    renderWithProviders()

    expect(screen.getByText('Loading projects...')).toBeInTheDocument()
  })

  it('shows error state', async () => {
    apiMocks.getDirectorActiveProjectsOverview.mockRejectedValue(new Error('Overview failed'))

    renderWithProviders()

    expect(await screen.findByText('Overview failed')).toBeInTheDocument()
  })

  it('applies filters and pagination params server-side', async () => {
    apiMocks.getDirectorActiveProjectsOverview.mockImplementation(
      async ({ page = 1 }) => ({
        data: [
          {
            id: `p${page}`,
            name: 'Tower A',
            code: 'TA-01',
            status: 'ACTIVE',
            projectManagerId: 'pm-1',
            projectManagerName: 'John Doe',
            projectManagerEmail: 'john@smartsite.com',
            budgetConsumptionPercent: 45,
            progressPercent: 40,
            risk: 'MEDIUM',
            lastUpdatedAt: new Date().toISOString(),
            budgetPlanned: 1000,
            budgetConsumed: 450,
            currency: 'USD',
          },
        ],
        pagination: {
          page,
          pageSize: 10,
          total: 2,
          totalPages: 2,
        },
      }),
    )

    apiMocks.getDirectorProjectFinancialKpis.mockResolvedValue({
      projectId: 'p1',
      projectName: 'Tower A',
      currency: 'USD',
      plannedBudget: 1000,
      consumedBudget: 450,
      burnRatePercent: 45,
      varianceAmount: 550,
      variancePercent: 55,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    })

    renderWithProviders()

    expect(await screen.findByText('Tower A')).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('All Statuses'), {
      target: { value: 'ACTIVE' },
    })
    fireEvent.change(screen.getByDisplayValue('All Risks'), {
      target: { value: 'MEDIUM' },
    })
    fireEvent.change(screen.getByPlaceholderText('Search by project name or code'), {
      target: { value: 'Tower' },
    })

    await waitFor(() => {
      expect(apiMocks.getDirectorActiveProjectsOverview).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ACTIVE',
          risk: 'MEDIUM',
          search: 'Tower',
        }),
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(apiMocks.getDirectorActiveProjectsOverview).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.any(Number),
        }),
      )
    })
  })
})
