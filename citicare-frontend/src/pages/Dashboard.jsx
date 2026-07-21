// pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import {
  Users,
  Heart,
  Calendar,
  AlertTriangle,
  Download,
  Brain,
  FileText,
  File
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts'
import { dashboardApi } from '../api/dashboardApi'
import StatCard from '../components/StatCard'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatTime, getStatusColor } from '../utils/helpers'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [riskDistribution, setRiskDistribution] = useState([])
  const [purokRiskData, setPurokRiskData] = useState([])
  const [commonDiseases, setCommonDiseases] = useState({
    overall: [],
    byPurok: {}
  })
  const [monthlyTrends, setMonthlyTrends] = useState([])
  const [todayActivities, setTodayActivities] = useState([])
  const [aiRecommendation, setAiRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPeriod, setAiPeriod] = useState('monthly')
  const [selectedPurokForDiseases, setSelectedPurokForDiseases] =
    useState('all')
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportMonth, setExportMonth] = useState(new Date().getMonth())
  const [exportYear, setExportYear] = useState(new Date().getFullYear())
  const [exportFormat, setExportFormat] = useState('pdf')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [
        statsRes,
        riskRes,
        purokRiskRes,
        diseasesRes,
        trendsRes,
        activitiesRes
      ] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRiskDistribution(),
        dashboardApi.getRiskDistributionByPurok(),
        dashboardApi.getCommonDiseases(),
        dashboardApi.getMonthlyTrends(),
        dashboardApi.getTodayActivities()
      ])
      if (statsRes.data.success) setStats(statsRes.data.data)
      if (riskRes.data.success) {
        const d = riskRes.data.data
        setRiskDistribution([
          { name: 'Critical', value: d.critical || 0, color: '#ef4444' },
          { name: 'High', value: d.high || 0, color: '#f97316' },
          { name: 'Moderate', value: d.moderate || 0, color: '#eab308' },
          { name: 'Low', value: d.low || 0, color: '#22c55e' }
        ])
      }
      if (purokRiskRes.data.success) setPurokRiskData(purokRiskRes.data.data)
      if (diseasesRes.data.success) setCommonDiseases(diseasesRes.data.data)
      if (trendsRes.data.success) setMonthlyTrends(trendsRes.data.data)
      if (activitiesRes.data.success)
        setTodayActivities(activitiesRes.data.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAIRecommendation = async period => {
    try {
      setAiLoading(true)
      const response = await dashboardApi.getAIRecommendation(period)
      if (response.data.success) setAiRecommendation(response.data.data)
    } catch (error) {
      console.error('AI Error:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const generateReportContent = dataToExport => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]

    if (exportFormat === 'pdf') {
      return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CitiCare Report - ${
        months[exportMonth]
      } ${exportYear}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#1a1a2e;line-height:1.6}.header{text-align:center;border-bottom:3px solid #1d4ed8;padding-bottom:20px;margin-bottom:30px}.header h1{color:#1d4ed8;font-size:28px;margin:0}.header p{color:#64748b;margin:5px 0}.section{margin-bottom:25px}.section h2{color:#1d4ed8;font-size:18px;border-bottom:1px solid #e2e8f0;padding-bottom:8px}.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:20px}.stat-box{background:#f1f5f9;border-radius:10px;padding:15px;text-align:center}.stat-box .value{font-size:24px;font-weight:bold;color:#1d4ed8}.stat-box .label{font-size:12px;color:#64748b}.finding{background:#eff6ff;border-left:4px solid #3b82f6;padding:10px 15px;margin:8px 0;border-radius:0 8px 8px 0}.risk-high{background:#fef2f2;border-left:4px solid #ef4444;padding:10px 15px;margin:8px 0;border-radius:0 8px 8px 0}.risk-medium{background:#fff7ed;border-left:4px solid #f97316;padding:10px 15px;margin:8px 0;border-radius:0 8px 8px 0}.risk-low{background:#fefce8;border-left:4px solid #eab308;padding:10px 15px;margin:8px 0;border-radius:0 8px 8px 0}.recommendation{background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 15px;margin:8px 0;border-radius:8px}.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:bold}.badge-high{background:#fee2e2;color:#dc2626}.badge-medium{background:#ffedd5;color:#ea580c}.badge-low{background:#dbeafe;color:#2563eb}.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px}table{width:100%;border-collapse:collapse;margin:10px 0}th{background:#1d4ed8;color:white;padding:10px;text-align:left;font-size:13px}td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px}tr:nth-child(even){background:#f8fafc}</style></head><body>
<div class="header"><h1>CitiCare Health Report</h1><p><strong>${
        months[exportMonth]
      } ${exportYear}</strong></p><p>Barangay Gumamela Healthcare Monitoring System</p><p>Generated: ${new Date().toLocaleString()}</p></div>
<div class="section"><h2>Overview Statistics</h2><div class="stat-grid"><div class="stat-box"><div class="value">${
        stats?.totalResidents || 0
      }</div><div class="label">Total Residents</div></div><div class="stat-box"><div class="value">${
        stats?.activeBHW || 0
      }</div><div class="label">Active BHWs</div></div><div class="stat-box"><div class="value">${
        stats?.todaySchedules || 0
      }</div><div class="label">Today's Schedules</div></div><div class="stat-box"><div class="value">${
        (stats?.criticalCount || 0) + (stats?.highCount || 0)
      }</div><div class="label">At-Risk Residents</div></div></div></div>
<div class="section"><h2>Executive Summary</h2><p>${
        dataToExport.summary || 'No summary available'
      }</p></div>
<div class="section"><h2>Key Findings</h2>${
        dataToExport.keyFindings
          ?.map(
            (f, i) =>
              `<div class="finding"><strong>${i + 1}.</strong> ${f}</div>`
          )
          .join('') || '<p>None</p>'
      }</div>
<div class="section"><h2>Risk Areas</h2>${
        dataToExport.riskAreas
          ?.map(
            r =>
              `<div class="risk-${r.severity}"><strong>${
                r.area
              }</strong> <span class="badge badge-${
                r.severity
              }">${r.severity?.toUpperCase()}</span><p style="margin:5px 0 0 0">${
                r.description
              }</p></div>`
          )
          .join('') || '<p>None</p>'
      }</div>
<div class="section"><h2>Recommended Actions</h2>${
        dataToExport.recommendations
          ?.map(
            r =>
              `<div class="recommendation"><span class="badge badge-${
                r.priority
              }">${r.priority?.toUpperCase()}</span> <strong>${
                r.action
              }</strong><p style="margin:5px 0 0 0;font-size:12px;color:#64748b">Category: ${
                r.category
              } | Target: ${r.targetGroup} | Timeline: ${r.timeline}</p></div>`
          )
          .join('') || '<p>None</p>'
      }</div>
<div class="section"><h2>Predictions & Trends</h2><p><strong>Next Month:</strong> ${
        dataToExport.predictedTrends?.nextMonth || 'N/A'
      }</p>${
        dataToExport.predictedTrends?.concerns?.length
          ? `<p><strong>Concerns:</strong></p><ul>${dataToExport.predictedTrends.concerns
              .map(c => `<li>${c}</li>`)
              .join('')}</ul>`
          : ''
      }${
        dataToExport.predictedTrends?.positiveIndicators?.length
          ? `<p><strong>Positive:</strong></p><ul>${dataToExport.predictedTrends.positiveIndicators
              .map(p => `<li>${p}</li>`)
              .join('')}</ul>`
          : ''
      }</div>
<div class="section"><h2>Medicine Demand Forecast</h2>${
        dataToExport.medicineDemandForecast?.forecasts?.length
          ? `<table><tr><th>Medicine</th><th>Demand</th><th>Reason</th><th>Timeline</th></tr>${dataToExport.medicineDemandForecast.forecasts
              .map(
                f =>
                  `<tr><td>${f.medicine}</td><td>${f.expectedDemand}</td><td>${f.reason}</td><td>${f.timeline}</td></tr>`
              )
              .join('')}</table>`
          : '<p>None</p>'
      }</div>
<div class="footer"><p>Generated by CitiCare AI Health Analytics System</p><p>Confidential - For authorized healthcare personnel only</p></div>
</body></html>`
    }

    return `CITICARE HEALTH REPORT\n${'='.repeat(50)}\nPeriod: ${
      months[exportMonth]
    } ${exportYear}\nGenerated: ${new Date().toLocaleString()}\nBarangay Gumamela Healthcare Monitoring System\n${'='.repeat(
      50
    )}\n\nOVERVIEW STATISTICS\n${'-'.repeat(30)}\nTotal Residents: ${
      stats?.totalResidents || 0
    }\nActive BHWs: ${stats?.activeBHW || 0}\nToday's Schedules: ${
      stats?.todaySchedules || 0
    }\nCritical Risk: ${stats?.criticalCount || 0}\nHigh Risk: ${
      stats?.highCount || 0
    }\n\nEXECUTIVE SUMMARY\n${'-'.repeat(30)}\n${
      dataToExport.summary || 'N/A'
    }\n\nKEY FINDINGS\n${'-'.repeat(30)}\n${
      dataToExport.keyFindings?.map((f, i) => `${i + 1}. ${f}`).join('\n\n') ||
      'None'
    }\n\nRISK AREAS\n${'-'.repeat(30)}\n${
      dataToExport.riskAreas
        ?.map(r => `[${r.severity?.toUpperCase()}] ${r.area}\n${r.description}`)
        .join('\n\n') || 'None'
    }\n\nRECOMMENDED ACTIONS\n${'-'.repeat(30)}\n${
      dataToExport.recommendations
        ?.map(
          r =>
            `[${r.priority?.toUpperCase()}] ${r.action}\nCategory: ${
              r.category
            } | Target: ${r.targetGroup} | Timeline: ${r.timeline}`
        )
        .join('\n\n') || 'None'
    }\n\nPREDICTIONS\n${'-'.repeat(30)}\n${
      dataToExport.predictedTrends?.nextMonth || 'N/A'
    }\nConcerns: ${
      dataToExport.predictedTrends?.concerns?.join(', ') || 'None'
    }\nPositive: ${
      dataToExport.predictedTrends?.positiveIndicators?.join(', ') || 'None'
    }\n\nMEDICINE FORECAST\n${'-'.repeat(30)}\n${
      dataToExport.medicineDemandForecast?.forecasts
        ?.map(f => `${f.medicine}: ${f.expectedDemand} (${f.timeline})`)
        .join('\n') || 'None'
    }\n\n${'='.repeat(50)}\nGenerated by CitiCare AI | Confidential`
  }

  const handleExportReport = async () => {
    try {
      setExportLoading(true)
      let dataToExport = aiRecommendation
      if (!dataToExport) {
        const response = await dashboardApi.getAIRecommendation(aiPeriod)
        if (response.data.success) dataToExport = response.data.data
      }
      if (!dataToExport) {
        alert('Unable to generate report.')
        setExportLoading(false)
        return
      }

      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]
      const content = generateReportContent(dataToExport)
      const ext = exportFormat === 'pdf' ? 'html' : 'doc'
      const mime = exportFormat === 'pdf' ? 'text/html' : 'application/msword'

      const blob = new Blob([content], { type: mime })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `CitiCare_Report_${months[exportMonth]}_${exportYear}.${ext}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setShowExportModal(false)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to export.')
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) return <LoadingSpinner message='Loading dashboard...' />

  const DISEASE_COLORS = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4'
  ]
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <div className='pl-1 flex items-center gap-2'>
          <h1 className='text-2xl font-bold text-white' style={{ fontFamily: "'Sora', sans-serif" }}>Dashboard</h1>
          <p className='text-sm text-white/50'>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <GlassButton icon={Download} onClick={() => setShowExportModal(true)}>
          Export Report
        </GlassButton>
      </div>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title='Export Health Report'
        size='md'
      >
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 p-0'>
            <div className='space-y-1.5'>
              <label className='text-xs text-white/50'>Month</label>
              <select
                value={exportMonth}
                onChange={e => setExportMonth(parseInt(e.target.value))}
                className='glass-select text-sm'
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-1.5'>
              <label className='text-xs text-white/50'>Year</label>
              <select
                value={exportYear}
                onChange={e => setExportYear(parseInt(e.target.value))}
                className='glass-select text-sm'
              >
                {years.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-xs text-white/50'>File Format</label>
            <div className='grid grid-cols-2 gap-3'>
              <button
                onClick={() => {
                  setExportFormat('pdf')
                  handleExportReport()
                }}
                disabled={exportLoading}
                className='p-4 rounded-xl border transition-all text-center bg-red-500/10 border-red-400/30 text-red-300 hover:bg-red-500/20 disabled:opacity-50'
              >
                {exportLoading ? (
                  <div className='w-8 h-8 border-2 border-red-300 border-t-transparent rounded-full animate-spin mx-auto mb-2' />
                ) : (
                  <FileText className='w-8 h-8 mx-auto mb-2' />
                )}
                <span className='text-sm font-medium'>PDF Report</span>
                <p className='text-[10px] mt-1 opacity-70'>
                  Formatted document
                </p>
              </button>
              <button
                onClick={() => {
                  setExportFormat('word')
                  handleExportReport()
                }}
                disabled={exportLoading}
                className='p-4 rounded-xl border transition-all text-center bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20 disabled:opacity-50'
              >
                {exportLoading ? (
                  <div className='w-8 h-8 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-2' />
                ) : (
                  <File className='w-8 h-8 mx-auto mb-2' />
                )}
                <span className='text-sm font-medium'>Word Document</span>
                <p className='text-[10px] mt-1 opacity-70'>Editable document</p>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          label='Total Residents'
          value={stats?.totalResidents || 0}
          icon={Users}
          color='blue'
        />
        <StatCard
          label='Active BHWs'
          value={stats?.activeBHW || 0}
          icon={Heart}
          color='green'
        />
        <StatCard
          label="Today's Schedules"
          value={stats?.todaySchedules || 0}
          icon={Calendar}
          color='purple'
        />
        <StatCard
          label='At-Risk Residents'
          value={(stats?.criticalCount || 0) + (stats?.highCount || 0)}
          icon={AlertTriangle}
          color='red'
        />
      </div>

      <GlassCard hover={false}>
        <h2 className='text-lg font-semibold text-white mb-2.5'>
          Residents Requiring Immediate Attention
        </h2>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-red-400'>
                Critical Risk
              </h3>
              <span className='text-xs bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full font-medium'>
                {stats?.criticalCount || 0} residents
              </span>
            </div>
            <div className='space-y-2 max-h-80 overflow-y-auto pr-1'>
              {stats?.criticalResidents?.length > 0 ? (
                stats.criticalResidents.map(r => (
                  <div
                    key={r.id}
                    className='bg-red-500/5 border border-red-400/15 rounded-lg p-3'
                  >
                    <div className='flex justify-between items-start'>
                      <div>
                        <p className='text-white text-sm font-medium'>
                          Resident #{r.id}
                        </p>
                        <p className='text-xs text-white/50 mt-0.5'>
                          {r.age}y • {r.purok}
                        </p>
                      </div>
                      <span className='text-xs text-red-400 font-bold bg-red-500/15 px-2 py-0.5 rounded'>
                        Score: {r.riskScore}
                      </span>
                    </div>
                    {r.conditions?.length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {r.conditions.map((c, i) => (
                          <span
                            key={i}
                            className='px-2 py-0.5 bg-red-500/10 text-red-300/80 rounded text-xs'
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className='text-white/25 text-sm text-center py-4'>
                  No critical risk residents
                </p>
              )}
            </div>
          </div>
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-orange-400'>
                High Risk
              </h3>
              <span className='text-xs bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-full font-medium'>
                {stats?.highCount || 0} residents
              </span>
            </div>
            <div className='space-y-2 max-h-80 overflow-y-auto pr-1'>
              {stats?.highRiskResidents?.length > 0 ? (
                stats.highRiskResidents.map(r => (
                  <div
                    key={r.id}
                    className='bg-orange-500/5 border border-orange-400/15 rounded-lg p-3'
                  >
                    <div className='flex justify-between items-start'>
                      <div>
                        <p className='text-white text-sm font-medium'>
                          Resident #{r.id}
                        </p>
                        <p className='text-xs text-white/50 mt-0.5'>
                          {r.age}y • {r.purok}
                        </p>
                      </div>
                      <span className='text-xs text-orange-400 font-bold bg-orange-500/15 px-2 py-0.5 rounded'>
                        Score: {r.riskScore}
                      </span>
                    </div>
                    {r.conditions?.length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {r.conditions.map((c, i) => (
                          <span
                            key={i}
                            className='px-2 py-0.5 bg-orange-500/10 text-orange-300/80 rounded text-xs'
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className='text-white/25 text-sm text-center py-4'>
                  No high risk residents
                </p>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <GlassCard hover={false}>
          <h2 className='text-lg font-semibold text-white mb-4'>
            Overall Risk Distribution
          </h2>
          <div className='h-64'>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx='50%'
                  cy='50%'
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey='value'
                >
                  {riskDistribution.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,21,53,0.95)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Legend
                  wrapperStyle={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard hover={false}>
          <h2 className='text-lg font-semibold text-white mb-4'>
            Risk Distribution by Purok
          </h2>
          <div className='h-64'>
            <ResponsiveContainer>
              <BarChart data={purokRiskData}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='rgba(255,255,255,0.1)'
                />
                <XAxis
                  dataKey='purokName'
                  stroke='rgba(255,255,255,0.5)'
                  fontSize={11}
                />
                <YAxis stroke='rgba(255,255,255,0.5)' fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,21,53,0.95)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Legend
                  wrapperStyle={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '12px'
                  }}
                />
                <Bar
                  dataKey='critical'
                  stackId='a'
                  fill='#ef4444'
                  name='Critical'
                />
                <Bar dataKey='high' stackId='a' fill='#f97316' name='High' />
                <Bar
                  dataKey='moderate'
                  stackId='a'
                  fill='#eab308'
                  name='Moderate'
                />
                <Bar dataKey='low' stackId='a' fill='#22c55e' name='Low' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard hover={false}>
        <div className='flex items-center justify-between mb-1'>
          <h2 className='text-lg font-semibold text-white'>
            Common Health Conditions
          </h2>
          <select
            value={selectedPurokForDiseases}
            onChange={e => setSelectedPurokForDiseases(e.target.value)}
            className='glass-select text-sm w-auto'
          >
            <option value='all'>All Puroks</option>
            {purokRiskData.map(p => (
              <option key={p.purokId} value={p.purokName}>
                {p.purokName}
              </option>
            ))}
          </select>
        </div>
        <p className='text-sm text-white/40 mb-4'>
          {selectedPurokForDiseases === 'all'
            ? ''
            : `Conditions recorded in ${selectedPurokForDiseases}`}
        </p>
        <div className='h-72'>
          <ResponsiveContainer>
            <BarChart
              data={
                selectedPurokForDiseases === 'all'
                  ? commonDiseases.overall.slice(0, 10)
                  : Object.entries(
                      commonDiseases.byPurok[selectedPurokForDiseases] || {}
                    )
                      .map(([n, c]) => ({ name: n, count: c }))
                      .sort((a, b) => b.count - a.count)
              }
              layout='vertical'
              margin={{ left: 10, right: 10 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='rgba(255,255,255,0.1)'
              />
              <XAxis
                type='number'
                stroke='rgba(255,255,255,0.5)'
                fontSize={11}
              />
              <YAxis
                dataKey='name'
                type='category'
                stroke='rgba(255,255,255,0.5)'
                fontSize={11}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,21,53,0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }}
                formatter={v => [`${v} cases`, 'Count']}
              />
              <Bar dataKey='count' radius={[0, 4, 4, 0]}>
                {(selectedPurokForDiseases === 'all'
                  ? commonDiseases.overall.slice(0, 10)
                  : []
                ).map((_, i) => (
                  <Cell
                    key={i}
                    fill={DISEASE_COLORS[i % DISEASE_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        <h2 className='text-lg font-semibold text-white mb-4'>
          Monthly Risk Trends
        </h2>
        <div className='h-72'>
          <ResponsiveContainer>
            <LineChart data={monthlyTrends}>
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='rgba(255,255,255,0.1)'
              />
              <XAxis
                dataKey='month'
                stroke='rgba(255,255,255,0.5)'
                fontSize={12}
              />
              <YAxis stroke='rgba(255,255,255,0.5)' fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,21,53,0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
              <Legend
                wrapperStyle={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '12px'
                }}
              />
              <Line
                type='monotone'
                dataKey='criticalHealthRisk'
                stroke='#ef4444'
                strokeWidth={2}
                dot={false}
                name='Critical'
              />
              <Line
                type='monotone'
                dataKey='highHealthRisk'
                stroke='#f97316'
                strokeWidth={2}
                dot={false}
                name='High'
              />
              <Line
                type='monotone'
                dataKey='moderateHealthRisk'
                stroke='#eab308'
                strokeWidth={2}
                dot={false}
                name='Moderate'
              />

              <Line
                type='monotone'
                dataKey='lowHealthRisk'
                stroke='#22c55e'
                strokeWidth={2}
                dot={false}
                name='Low'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        <h2 className='text-lg font-semibold text-white mb-2.5'>
          Today's Activities
        </h2>
        <div className='overflow-x-auto'>
          <table className='glass-table'>
            <thead>
              <tr>
                <th>Resident / Program</th>
                <th>Time</th>
                <th>Type</th>
                <th>Location</th>
                <th>Assigned BHW</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {todayActivities.length > 0 ? (
                todayActivities.map(a => (
                  <tr key={a.id}>
                    <td className='text-white font-medium'>{a.residentName}</td>
                    <td className='text-white/70'>{formatTime(a.time)}</td>
                    <td className='text-white/70'>{a.serviceType}</td>
                    <td className='text-white/70'>{a.location || 'N/A'}</td>
                    <td className='text-white/70'>{a.assignedBhw}</td>
                    <td>
                      <span className={`badge ${getStatusColor(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className='py-8 text-center text-white/40'>
                    No activities scheduled for today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        <div className='flex items-center justify-between mb-1'>
          <div>
            <h2 className='text-lg font-semibold text-white'>
              AI Health Recommendations
            </h2>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex bg-white/5 rounded-lg p-1'>
              {['monthly', 'quarterly', 'annual'].map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setAiPeriod(p)
                    fetchAIRecommendation(p)
                  }}
                  className={`px-3.5 py-1.5 rounded-md text-sm transition-all ${
                    aiPeriod === p
                      ? 'bg-purple-500/30 text-purple-300 font-medium'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        {aiLoading ? (
          <div className='flex flex-col items-center justify-center py-16 mt-4'>
            <div className='w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4' />
            <p className='text-purple-300/80 text-sm'>
              Analyzing health data...
            </p>
          </div>
        ) : aiRecommendation ? (
          <div className='space-y-5 mt-4'>
            <div className='bg-purple-500/5 border border-purple-400/15 rounded-xl p-5'>
              <h3 className='text-sm font-semibold text-purple-300 mb-2'>
                Executive Summary
              </h3>
              <p className='text-white/80 text-sm leading-relaxed'>
                {aiRecommendation.summary}
              </p>
              <div className='flex items-center gap-4 mt-3 text-xs text-white/30'>
                <span>
                  Generated:{' '}
                  {new Date(aiRecommendation.generatedAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
              <div>
                <h3 className='text-sm font-semibold text-blue-300 mb-3'>
                  Key Findings
                </h3>
                <div className='space-y-2'>
                  {aiRecommendation.keyFindings?.map((f, i) => (
                    <div
                      key={i}
                      className='bg-blue-500/5 border border-blue-400/15 rounded-lg p-3 flex gap-3'
                    >
                      <span className='text-blue-400 font-bold text-sm'>
                        {i + 1}.
                      </span>
                      <p className='text-white/75 text-sm'>{f}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className='text-sm font-semibold text-red-300 mb-3'>
                  Risk Areas
                </h3>
                <div className='space-y-2'>
                  {aiRecommendation.riskAreas?.map((r, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 ${
                        r.severity === 'high'
                          ? 'bg-red-500/5 border-red-400/15'
                          : r.severity === 'medium'
                          ? 'bg-orange-500/5 border-orange-400/15'
                          : 'bg-yellow-500/5 border-yellow-400/15'
                      }`}
                    >
                      <div className='flex justify-between mb-1.5'>
                        <h4 className='text-white text-sm font-medium'>
                          {r.area}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            r.severity === 'high'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-orange-500/20 text-orange-300'
                          }`}
                        >
                          {r.severity?.toUpperCase()}
                        </span>
                      </div>
                      <p className='text-white/60 text-xs'>{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3 className='text-sm font-semibold text-green-300 mb-3'>
                Recommended Actions
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {aiRecommendation.recommendations?.map((r, i) => (
                  <div
                    key={i}
                    className='bg-green-500/5 border border-green-400/15 rounded-lg p-4'
                  >
                    <div className='flex items-center gap-2 mb-2'>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.priority === 'high'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-orange-500/20 text-orange-300'
                        }`}
                      >
                        {r.priority?.toUpperCase()}
                      </span>
                      <span className='text-xs text-white/40'>
                        {r.category}
                      </span>
                      <span className='text-xs text-white/40'>
                        • {r.timeline}
                      </span>
                    </div>
                    <p className='text-white text-sm font-medium mb-2'>
                      {r.action}
                    </p>
                    <div className='flex gap-3 text-xs text-white/50'>
                      <span>{r.targetGroup}</span>
                      <span>→ {r.expectedImpact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {aiRecommendation.predictedTrends && (
              <div className='bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-400/15 rounded-xl p-4'>
                <h3 className='text-sm font-semibold text-purple-300 mb-2'>
                  Predictions
                </h3>
                <p className='text-white/75 text-sm mb-3'>
                  {aiRecommendation.predictedTrends.nextMonth}
                </p>
                <div className='grid grid-cols-2 gap-3'>
                  {aiRecommendation.predictedTrends.concerns?.length > 0 && (
                    <div>
                      <p className='text-xs text-red-400/70 mb-1.5'>Concerns</p>
                      {aiRecommendation.predictedTrends.concerns.map((c, i) => (
                        <p key={i} className='text-xs text-red-300/60'>
                          • {c}
                        </p>
                      ))}
                    </div>
                  )}
                  {aiRecommendation.predictedTrends.positiveIndicators?.length >
                    0 && (
                    <div>
                      <p className='text-xs text-green-400/70 mb-1.5'>
                        Positive
                      </p>
                      {aiRecommendation.predictedTrends.positiveIndicators.map(
                        (p, i) => (
                          <p key={i} className='text-xs text-green-300/60'>
                            • {p}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='text-center py-12 mt-4'>
            <Brain className='w-10 h-10 text-white/15 mx-auto mb-3' />
            <p className='text-white/30 text-sm'>
              Click a period above to generate AI recommendations
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

export default Dashboard
