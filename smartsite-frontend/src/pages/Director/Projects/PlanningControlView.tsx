import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Brain, Calendar, ChevronRight, Info } from 'lucide-react'
import { getProjectPlanningAnalysis, getProjectPlanningAiAudit } from '../../../lib/api'
import { useResponsive } from '../../../hooks/useResponsive'

interface PlanningControlViewProps {
  projectId: string
}

export default function PlanningControlView({ projectId }: PlanningControlViewProps) {
  const { isMobile } = useResponsive()

  const analysisQuery = useQuery({
    queryKey: ['project-planning-analysis', projectId],
    queryFn: () => getProjectPlanningAnalysis(projectId),
    enabled: !!projectId,
  })

  const aiAuditQuery = useQuery({
    queryKey: ['project-planning-ai-audit', projectId],
    queryFn: () => getProjectPlanningAiAudit(projectId),
    enabled: !!projectId,
  })

  if (!projectId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', color: '#6b7280', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
        <Calendar size={48} style={{ marginBottom: '16px', color: '#d1d5db' }} />
        <p>Please select a project to analyze its planning security.</p>
      </div>
    )
  }

  const analysis = analysisQuery.data
  const aiAudit = aiAuditQuery.data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* AI Header Section */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 100%)', color: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '16px', opacity: 0.1 }}>
          <Brain size={120} />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ backgroundColor: 'rgba(96, 165, 250, 0.2)', padding: '8px', borderRadius: '8px' }}>
              <Brain size={20} style={{ color: '#93c5fd' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, letterSpacing: '-0.025em' }}>AI Planning Audit</h3>
            <span style={{ padding: '2px 8px', backgroundColor: 'rgba(59, 130, 246, 0.3)', color: '#bfdbfe', fontSize: '12px', borderRadius: '9999px', border: '1px solid rgba(96, 165, 250, 0.3)', marginLeft: '8px' }}>
              Senior AI Auditor
            </span>
          </div>
          
          {aiAuditQuery.isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
              <div style={{ height: '16px', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', width: '75%' }}></div>
              <div style={{ height: '16px', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', width: '50%' }}></div>
            </div>
          ) : (
            <p style={{ color: '#dbeafe', lineHeight: 1.6, fontSize: isMobile ? '14px' : '16px', fontStyle: 'italic', maxWidth: '800px', margin: 0 }}>
              "{aiAudit?.recommendation}"
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '24px' }}>
        {/* Planning Network Graph */}
        <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Calendar size={20} style={{ color: '#4f46e5' }} />
              Critical Path Visualization (CPM)
            </h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}></span>
                <span style={{ color: '#4b5563' }}>Critical Path</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                <span style={{ color: '#4b5563' }}>Buffer Task</span>
              </div>
            </div>
          </div>

          {analysisQuery.isLoading ? (
             <div style={{ height: '256px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Calculating graph nodes...</div>
          ) : (
            <div style={{ position: 'relative', minHeight: '400px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '24px', alignItems: 'center' }}>
               <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '48px', maxWidth: '100%', position: 'relative' }}>
                  {analysis?.tasks.map((task) => (
                    <div key={task.id} style={{ position: 'relative' }}>
                      {/* Connection Line to predecessor */}
                      {task.predecessorId && (
                        <div style={{ position: 'absolute', left: '-36px', top: '50%', transform: 'translateY(-50%)', color: '#d1d5db' }}>
                           <ChevronRight size={24} />
                        </div>
                      )}
                      
                      <div style={{
                        width: '180px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: task.isCritical ? '2px solid #ef4444' : '2px solid #bfdbfe',
                        backgroundColor: task.isCritical ? '#fef2f2' : 'white',
                        transition: 'all 0.3s ease',
                        boxShadow: task.isCritical ? '0 0 15px rgba(239, 68, 68, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 'bold', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                backgroundColor: task.isCritical ? '#ef4444' : '#dbeafe',
                                color: task.isCritical ? 'white' : '#1e40af'
                            }}>
                              {task.isCritical ? 'Critical' : 'Standard'}
                            </span>
                            {task.isCritical && <AlertTriangle size={14} style={{ color: '#ef4444' }} />}
                          </div>
                          <h4 style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '14px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '4px' }}>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Planned</span>
                               <span style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>{new Date(task.plannedDate).toLocaleDateString()}</span>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                               <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Slack</span>
                               <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', color: task.slackDays === 0 ? '#dc2626' : '#16a34a' }}>
                                 {task.slackDays}d
                               </span>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
               
               <div style={{ marginTop: 'auto', paddingTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#9ca3af' }}>
                  <Info size={14} />
                  <span>Interactive node relationships calculated by backend graph engine</span>
               </div>
            </div>
          )}
        </div>

        {/* Risk Analysis Summary Card */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '24px', color: 'white', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 24px 0' }}>
              <AlertTriangle size={20} style={{ color: '#fbbf24' }} />
              Strategic Risk Audit
           </h3>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                 <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '4px' }}>Critical Tasks</div>
                 <div style={{ fontSize: '24px', fontWeight: 900, color: '#f87171' }}>{analysis?.criticalPathIds.length || 0}</div>
                 <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', margin: '8px 0 0' }}>Milestones with zero flexibility</p>
              </div>

              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                 <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '4px' }}>Safety Buffer</div>
                 <div style={{ fontSize: '24px', fontWeight: 900, color: '#818cf8' }}>
                    {analysis?.tasks.length 
                      ? Math.round((analysis.tasks.filter(t => !t.isCritical).length / analysis.tasks.length) * 100) 
                      : 0}%
                 </div>
                 <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', margin: '8px 0 0' }}>Portion of project with flexibility</p>
              </div>

              <div style={{ marginTop: '24px' }}>
                 <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '12px', margin: '0 0 12px 0' }}>Technical Breakdown</h4>
                 {analysis?.tasks.filter(t => t.isCritical).slice(0, 3).map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                       <span style={{ color: '#94a3b8' }}>{task.name}</span>
                       <span style={{ color: '#f87171', fontFamily: 'monospace' }}>0d Slack</span>
                    </div>
                 ))}
                 {analysis?.criticalPathIds && analysis.criticalPathIds.length > 3 && (
                    <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '8px' }}>...and {analysis.criticalPathIds.length - 3} more critical milestones</div>
                 )}
              </div>
           </div>

           <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <button 
                onClick={() => window.print()}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: '#075B7A', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                 Generate PDF Report
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}
