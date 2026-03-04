import { useState } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { ChaosVisualizer } from './components/ChaosVisualizer'
import type { ScanReport, OrganizationReport } from './types'
import { SoundManager } from './systems/SoundManager'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [scanReport, setScanReport] = useState<ScanReport | null>(null)
  const [orgReport, setOrgReport] = useState<OrganizationReport | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [canUndo, setCanUndo] = useState(false)

  const handleSelectDirectory = async () => {
    try {
      const path = await window.ipcRenderer.invoke('select-directory')
      if (path) {
        setCurrentPath(path)
        setScanReport(null)
        setOrgReport(null)
      }
    } catch (error) {
      console.error("Selection failed", error)
    }
  }

  const handleScan = async () => {
    if (!currentPath) return
    setIsScanning(true)

    // Simulate some "cyber" delay for effect if too fast
    await new Promise(r => setTimeout(r, 800))

    try {
      const report = await window.ipcRenderer.invoke('scan-directory', currentPath)
      setScanReport(report)
    } catch (error) {
      console.error("Scan failed", error)
    } finally {
      setIsScanning(false)
    }
  }

  const handleSimulateOrganization = async () => {
    if (!currentPath) return
    setIsOrganizing(true)
    try {
      const report = await window.ipcRenderer.invoke('organize-directory', currentPath, true) // Dry run
      setOrgReport(report)
    } catch (error) {
      console.error("Org Simulation failed", error)
    } finally {
      setIsOrganizing(false)
    }
  }

  const handleExecuteOrganization = async () => {
    if (!currentPath) return
    setIsOrganizing(true)
    try {
      const report = await window.ipcRenderer.invoke('organize-directory', currentPath, false) // Real run
      // Update report to show done status or verify
      setOrgReport(prev => prev ? { ...prev, ...report } : report)
      setCanUndo(true) // Enable undo
      SoundManager.getInstance().playSuccess()
      alert('Organization Complete!')
    } catch (error) {
      console.error("Org Execution failed", error)
    } finally {
      setIsOrganizing(false)
    }
  }

  const handleUndo = async () => {
    try {
      const result = await window.ipcRenderer.invoke('undo-last-organization');
      if (result.success) {
        setCanUndo(false);
        SoundManager.getInstance().playClick();
        alert('Undo Successful! Rescanning...');
        handleScan(); // Refresh
      } else {
        alert('Undo Failed: ' + result.message);
      }
    } catch (error) {
      console.error("Undo failed", error);
    }
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen bg-cyber-black text-white font-sans overflow-hidden flex selection:bg-cyber-cyan selection:text-black relative">

        {/* Background Grid (Global) */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0"></div>

        {/* Left Panel: Controls */}
        <ControlPanel
          currentPath={currentPath}
          onSelectDirectory={handleSelectDirectory}
          scanReport={scanReport}
          isScanning={isScanning}
          onScan={handleScan}
          orgReport={orgReport}
          isOrganizing={isOrganizing}
          onRunOrganizer={handleSimulateOrganization}
          onConfirm={handleExecuteOrganization}
          canUndo={canUndo}
          onUndo={handleUndo}
        />

        {/* Right Panel: Visualization Canvas */}
        <div className="flex-1 relative h-full bg-black/20 z-10 relative">
          {/* We always show the visualizer container, even if empty, to maintain layout stability */}
          <ChaosVisualizer
            report={scanReport}
            isOrganizing={isOrganizing}
          />

          {!scanReport && (
            <div className="absolute inset-0 flex items-center justify-center text-cyber-dim/20 font-mono text-4xl font-bold tracking-widest pointer-events-none select-none">
              WAITING FOR DATA STREAM...
            </div>
          )}
        </div>

      </div>
    </ErrorBoundary>
  )
}

export default App
