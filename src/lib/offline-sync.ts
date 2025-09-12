'use client'

interface OfflineData {
  id: string
  type: 'exercise_completion' | 'day_progression' | 'milestone_advancement' | 'user_progress'
  data: any
  timestamp: number
  retryCount: number
  lastRetry?: number
  priority: number
}

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingItems: number
  lastSyncTime: number | null
  errors: string[]
}

class OfflineSyncManager {
  private static instance: OfflineSyncManager
  private pendingData: Map<string, OfflineData> = new Map()
  private syncInProgress = false
  private maxRetries = 5
  private syncListeners: ((status: SyncStatus) => void)[] = []
  private storageKey = 'workout-offline-data'

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager()
    }
    return OfflineSyncManager.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      // Load pending data from localStorage on init
      this.loadPendingData()

      // Set up online/offline listeners
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))

      // Periodic sync attempt when online
      setInterval(this.periodicSync.bind(this), 30000) // Every 30 seconds
    }
  }

  private loadPendingData(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.pendingData = new Map(Object.entries(data).map(([k, v]) => [k, v as OfflineData]))
      }
    } catch (error) {
      console.error('Failed to load offline data:', error)
    }
  }

  private savePendingData(): void {
    try {
      const data = Object.fromEntries(this.pendingData)
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  private handleOnline(): void {
    console.log('Connection restored, initiating sync...')
    this.triggerSync()
  }

  private handleOffline(): void {
    console.log('Connection lost, entering offline mode...')
    this.notifyListeners()
  }

  private periodicSync(): void {
    if (navigator.onLine && this.pendingData.size > 0 && !this.syncInProgress) {
      this.triggerSync()
    }
  }

  private notifyListeners(): void {
    const status: SyncStatus = {
      isOnline: navigator.onLine,
      isSyncing: this.syncInProgress,
      pendingItems: this.pendingData.size,
      lastSyncTime: this.getLastSyncTime(),
      errors: this.getRecentErrors(),
    }

    this.syncListeners.forEach((listener) => {
      try {
        listener(status)
      } catch (error) {
        console.error('Sync listener error:', error)
      }
    })
  }

  private getLastSyncTime(): number | null {
    try {
      const lastSync = localStorage.getItem('workout-last-sync')
      return lastSync ? parseInt(lastSync, 10) : null
    } catch {
      return null
    }
  }

  private setLastSyncTime(): void {
    try {
      localStorage.setItem('workout-last-sync', Date.now().toString())
    } catch (error) {
      console.error('Failed to set last sync time:', error)
    }
  }

  private getRecentErrors(): string[] {
    try {
      const errors = localStorage.getItem('workout-sync-errors')
      if (errors) {
        const parsed = JSON.parse(errors)
        const oneHourAgo = Date.now() - 60 * 60 * 1000
        return parsed
          .filter((error: any) => error.timestamp > oneHourAgo)
          .map((error: any) => error.message)
      }
    } catch (error) {
      console.error('Failed to get recent errors:', error)
    }
    return []
  }

  private addSyncError(message: string): void {
    try {
      const errors = this.getRecentErrors()
      errors.push(message)
      const errorData = errors.slice(-10).map((msg) => ({ message: msg, timestamp: Date.now() }))
      localStorage.setItem('workout-sync-errors', JSON.stringify(errorData))
    } catch (error) {
      console.error('Failed to save sync error:', error)
    }
  }

  // Public methods
  addPendingData(type: OfflineData['type'], data: any, priority = 5): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const offlineData: OfflineData = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      priority,
    }

    this.pendingData.set(id, offlineData)
    this.savePendingData()
    this.notifyListeners()

    // If online, trigger immediate sync
    if (navigator.onLine) {
      setTimeout(() => this.triggerSync(), 100)
    }

    return id
  }

  removePendingData(id: string): boolean {
    const removed = this.pendingData.delete(id)
    if (removed) {
      this.savePendingData()
      this.notifyListeners()
    }
    return removed
  }

  getPendingData(): OfflineData[] {
    return Array.from(this.pendingData.values()).sort((a, b) => b.priority - a.priority) // Higher priority first
  }

  addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener)

    // Initial notification
    listener({
      isOnline: navigator.onLine,
      isSyncing: this.syncInProgress,
      pendingItems: this.pendingData.size,
      lastSyncTime: this.getLastSyncTime(),
      errors: this.getRecentErrors(),
    })

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener)
      if (index > -1) {
        this.syncListeners.splice(index, 1)
      }
    }
  }

  async triggerSync(force = false): Promise<boolean> {
    if (this.syncInProgress && !force) {
      return false
    }

    if (!navigator.onLine) {
      console.log('Skipping sync - offline')
      return false
    }

    if (this.pendingData.size === 0) {
      return true
    }

    this.syncInProgress = true
    this.notifyListeners()

    try {
      const pendingItems = this.getPendingData()
      let syncedCount = 0
      let errorCount = 0

      for (const item of pendingItems) {
        try {
          const success = await this.syncItem(item)
          if (success) {
            this.removePendingData(item.id)
            syncedCount++
          } else {
            errorCount++
            // Increment retry count
            item.retryCount++
            item.lastRetry = Date.now()

            // Remove item if max retries exceeded
            if (item.retryCount >= this.maxRetries) {
              console.warn(`Max retries exceeded for item ${item.id}, removing from queue`)
              this.removePendingData(item.id)
              this.addSyncError(`Failed to sync ${item.type} after ${this.maxRetries} attempts`)
            }
          }
        } catch (error) {
          console.error(`Sync error for item ${item.id}:`, error)
          errorCount++
          item.retryCount++
          item.lastRetry = Date.now()
        }

        // Stop syncing if we go offline during sync
        if (!navigator.onLine) {
          break
        }
      }

      if (syncedCount > 0) {
        this.setLastSyncTime()
        console.log(`Successfully synced ${syncedCount} items`)
      }

      if (errorCount > 0) {
        console.warn(`${errorCount} items failed to sync`)
      }

      return errorCount === 0
    } catch (error) {
      console.error('Sync process error:', error)
      this.addSyncError('Sync process failed: ' + (error as Error).message)
      return false
    } finally {
      this.syncInProgress = false
      this.savePendingData()
      this.notifyListeners()
    }
  }

  private async syncItem(item: OfflineData): Promise<boolean> {
    // This would be implemented based on your actual sync endpoints
    // For now, we'll simulate different sync operations

    try {
      switch (item.type) {
        case 'exercise_completion':
          return await this.syncExerciseCompletion(item.data)
        case 'day_progression':
          return await this.syncDayProgression(item.data)
        case 'milestone_advancement':
          return await this.syncMilestoneAdvancement(item.data)
        case 'user_progress':
          return await this.syncUserProgress(item.data)
        default:
          console.warn('Unknown sync item type:', item.type)
          return false
      }
    } catch (error) {
      console.error(`Failed to sync ${item.type}:`, error)
      return false
    }
  }

  private async syncExerciseCompletion(data: any): Promise<boolean> {
    // Call the actual exercise completion server action
    // This is a placeholder - replace with actual implementation
    try {
      // const result = await completeExerciseAndAdvance(data)
      console.log('Syncing exercise completion:', data)
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    } catch (error) {
      console.error('Exercise completion sync failed:', error)
      return false
    }
  }

  private async syncDayProgression(data: any): Promise<boolean> {
    try {
      // const result = await advanceToNextDay(data)
      console.log('Syncing day progression:', data)
      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    } catch (error) {
      console.error('Day progression sync failed:', error)
      return false
    }
  }

  private async syncMilestoneAdvancement(data: any): Promise<boolean> {
    try {
      // const result = await advanceToNextMilestone(data)
      console.log('Syncing milestone advancement:', data)
      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    } catch (error) {
      console.error('Milestone advancement sync failed:', error)
      return false
    }
  }

  private async syncUserProgress(data: any): Promise<boolean> {
    try {
      // const result = await updateUserProgress(data)
      console.log('Syncing user progress:', data)
      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    } catch (error) {
      console.error('User progress sync failed:', error)
      return false
    }
  }

  // Utility methods
  clearAllPendingData(): void {
    this.pendingData.clear()
    this.savePendingData()
    this.notifyListeners()
  }

  getStatus(): SyncStatus {
    return {
      isOnline: navigator.onLine,
      isSyncing: this.syncInProgress,
      pendingItems: this.pendingData.size,
      lastSyncTime: this.getLastSyncTime(),
      errors: this.getRecentErrors(),
    }
  }

  // Clean up resources
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this))
      window.removeEventListener('offline', this.handleOffline.bind(this))
    }
    this.syncListeners.length = 0
  }
}

// Export singleton instance
export const offlineSyncManager = OfflineSyncManager.getInstance()

// Export types
export type { OfflineData, SyncStatus }
