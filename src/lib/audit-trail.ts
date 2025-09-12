'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { getCurrentProductUser } from '@/lib/auth-server'

export interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userEmail?: string
  action: AuditAction
  entityType:
    | 'user_progress'
    | 'exercise_completion'
    | 'program_enrollment'
    | 'milestone_advancement'
    | 'day_completion'
    | 'session'
  entityId: string
  changes: {
    before: Record<string, any>
    after: Record<string, any>
    diff?: Record<string, any>
  }
  metadata: {
    source: 'web_app' | 'mobile_app' | 'api' | 'system'
    userAgent?: string
    ipAddress?: string
    sessionId?: string
    transactionId?: string
    programId?: string
    milestoneIndex?: number
    dayIndex?: number
    exerciseId?: string
  }
  context: {
    route?: string
    component?: string
    feature?: string
    version?: string
  }
  status: 'success' | 'failure' | 'partial'
  errorMessage?: string
  validationWarnings?: string[]
  performanceMetrics?: {
    duration: number
    queryCount: number
    cacheHits: number
    cacheMisses: number
  }
}

export type AuditAction =
  | 'progress_update'
  | 'milestone_advance'
  | 'day_advance'
  | 'day_complete'
  | 'exercise_complete'
  | 'program_enroll'
  | 'program_complete'
  | 'session_start'
  | 'session_end'
  | 'data_export'
  | 'data_import'
  | 'rollback'
  | 'validation_failure'
  | 'concurrent_update_conflict'
  | 'system_maintenance'

export interface AuditQuery {
  userId?: string
  action?: AuditAction | AuditAction[]
  entityType?: AuditEntry['entityType'] | AuditEntry['entityType'][]
  entityId?: string
  programId?: string
  dateFrom?: string
  dateTo?: string
  status?: AuditEntry['status'] | AuditEntry['status'][]
  source?: AuditEntry['metadata']['source']
  limit?: number
  offset?: number
  orderBy?: 'timestamp' | 'action' | 'status'
  orderDirection?: 'asc' | 'desc'
}

export interface AuditStats {
  totalEntries: number
  entriesByAction: Record<AuditAction, number>
  entriesByStatus: Record<AuditEntry['status'], number>
  entriesBySource: Record<AuditEntry['metadata']['source'], number>
  dateRange: {
    earliest: string
    latest: string
  }
  averagePerformance?: {
    duration: number
    queryCount: number
  }
  topUsers: Array<{
    userId: string
    userEmail?: string
    entryCount: number
  }>
  errorRate: number
  validationWarningRate: number
}

/**
 * Comprehensive audit trail system for tracking all progress changes
 */
export class AuditTrailManager {
  private payload: any

  constructor() {}

  async initialize(): Promise<void> {
    this.payload = await getPayload({ config: configPromise })
  }

  /**
   * Create a new audit entry
   */
  async createAuditEntry(
    action: AuditAction,
    entityType: AuditEntry['entityType'],
    entityId: string,
    changes: AuditEntry['changes'],
    metadata: Partial<AuditEntry['metadata']> = {},
    context: Partial<AuditEntry['context']> = {},
    status: AuditEntry['status'] = 'success',
    options: {
      errorMessage?: string
      validationWarnings?: string[]
      performanceMetrics?: AuditEntry['performanceMetrics']
    } = {},
  ): Promise<string | null> {
    try {
      if (!this.payload) {
        await this.initialize()
      }

      // Get current user for audit context
      const currentUser = await getCurrentProductUser()
      if (!currentUser) {
        console.error('Cannot create audit entry without authenticated user')
        return null
      }

      const auditEntry: Omit<AuditEntry, 'id'> = {
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        action,
        entityType,
        entityId,
        changes: {
          ...changes,
          diff: this.calculateDiff(changes.before, changes.after),
        },
        metadata: {
          source: 'web_app',
          sessionId: `session_${Date.now()}_${currentUser.id}`,
          ...metadata,
        },
        context,
        status,
        ...(options.errorMessage && { errorMessage: options.errorMessage }),
        ...(options.validationWarnings && { validationWarnings: options.validationWarnings }),
        ...(options.performanceMetrics && { performanceMetrics: options.performanceMetrics }),
      }

      // Store audit entry in exercise completions collection with special markers
      // TODO: Create dedicated audit collection when PayloadCMS schema is updated
      const auditRecord = await this.payload.create({
        collection: 'exerciseCompletions',
        data: {
          productUser: currentUser.id,
          exercise: `audit-${action}`, // Special marker for audit entries
          program: metadata.programId || 'system',
          milestoneIndex: metadata.milestoneIndex || 0,
          dayIndex: metadata.dayIndex || 0,
          sets: 0,
          reps: 0,
          completedAt: auditEntry.timestamp,
          notes: JSON.stringify(auditEntry), // Store full audit data in notes
          // Add audit-specific metadata in weight field (safe since sets/reps are 0)
          weight: this.encodeAuditMetadata({
            action,
            entityType,
            status,
            source: auditEntry.metadata.source,
          }),
        },
      })

      return auditRecord.id as string
    } catch (error) {
      console.error('Failed to create audit entry:', error)
      return null
    }
  }

  /**
   * Retrieve audit entries based on query parameters
   */
  async queryAuditEntries(query: AuditQuery): Promise<{
    entries: AuditEntry[]
    totalCount: number
    hasMore: boolean
  }> {
    try {
      if (!this.payload) {
        await this.initialize()
      }

      // Build PayloadCMS query conditions
      const conditions: any[] = []

      // Filter for audit entries only
      conditions.push({
        exercise: { like: 'audit-%' },
      })

      if (query.userId) {
        conditions.push({
          productUser: { equals: query.userId },
        })
      }

      if (query.programId) {
        conditions.push({
          program: { equals: query.programId },
        })
      }

      if (query.dateFrom || query.dateTo) {
        const dateConditions: any = {}
        if (query.dateFrom) {
          dateConditions.greater_than_equal = query.dateFrom
        }
        if (query.dateTo) {
          dateConditions.less_than_equal = query.dateTo
        }
        conditions.push({
          completedAt: dateConditions,
        })
      }

      const result = await this.payload.find({
        collection: 'exerciseCompletions',
        where: conditions.length > 1 ? { and: conditions } : conditions[0] || {},
        limit: query.limit || 50,
        page: query.offset ? Math.floor(query.offset / (query.limit || 50)) + 1 : 1,
        sort: query.orderDirection === 'asc' ? 'completedAt' : '-completedAt',
      })

      // Parse audit entries from stored data
      const entries: AuditEntry[] = []
      for (const doc of result.docs || []) {
        try {
          if (doc.notes) {
            const auditData = JSON.parse(doc.notes)
            entries.push({
              id: doc.id,
              ...auditData,
            })
          }
        } catch (parseError) {
          console.warn('Failed to parse audit entry:', parseError)
        }
      }

      // Apply client-side filtering for complex conditions not supported by PayloadCMS
      let filteredEntries = entries

      if (query.action) {
        const actions = Array.isArray(query.action) ? query.action : [query.action]
        filteredEntries = filteredEntries.filter((entry) => actions.includes(entry.action))
      }

      if (query.entityType) {
        const entityTypes = Array.isArray(query.entityType) ? query.entityType : [query.entityType]
        filteredEntries = filteredEntries.filter((entry) => entityTypes.includes(entry.entityType))
      }

      if (query.status) {
        const statuses = Array.isArray(query.status) ? query.status : [query.status]
        filteredEntries = filteredEntries.filter((entry) => statuses.includes(entry.status))
      }

      if (query.source) {
        filteredEntries = filteredEntries.filter((entry) => entry.metadata.source === query.source)
      }

      return {
        entries: filteredEntries,
        totalCount: result.totalDocs || 0,
        hasMore: result.hasNextPage || false,
      }
    } catch (error) {
      console.error('Failed to query audit entries:', error)
      return {
        entries: [],
        totalCount: 0,
        hasMore: false,
      }
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(
    userId?: string,
    programId?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<AuditStats> {
    try {
      const query: AuditQuery = {
        ...(userId && { userId }),
        ...(programId && { programId }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        limit: 10000, // Get all entries for stats
      }

      const { entries } = await this.queryAuditEntries(query)

      // Calculate statistics
      const entriesByAction: Partial<Record<AuditAction, number>> = {}
      const entriesByStatus: Partial<Record<AuditEntry['status'], number>> = {}
      const entriesBySource: Partial<Record<AuditEntry['metadata']['source'], number>> = {}
      const userCounts: Record<string, { count: number; email?: string }> = {}

      let totalDuration = 0
      let totalQueryCount = 0
      let performanceEntryCount = 0
      let errorCount = 0
      let warningCount = 0

      for (const entry of entries) {
        // Count by action
        entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1

        // Count by status
        entriesByStatus[entry.status] = (entriesByStatus[entry.status] || 0) + 1

        // Count by source
        entriesBySource[entry.metadata.source] = (entriesBySource[entry.metadata.source] || 0) + 1

        // Count by user
        if (!userCounts[entry.userId]) {
          userCounts[entry.userId] = {
            count: 0,
            ...(entry.userEmail && { email: entry.userEmail }),
          }
        }
        userCounts[entry.userId]!.count++

        // Performance metrics
        if (entry.performanceMetrics) {
          totalDuration += entry.performanceMetrics.duration
          totalQueryCount += entry.performanceMetrics.queryCount
          performanceEntryCount++
        }

        // Error and warning counts
        if (entry.status === 'failure') errorCount++
        if (entry.validationWarnings && entry.validationWarnings.length > 0) warningCount++
      }

      // Calculate date range
      const dates = entries.map((e) => new Date(e.timestamp).getTime()).filter(Boolean)
      const dateRange = {
        earliest:
          dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : new Date().toISOString(),
        latest:
          dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : new Date().toISOString(),
      }

      // Top users
      const topUsers = Object.entries(userCounts)
        .map(([userId, { count, email }]) => ({
          userId,
          ...(email && { userEmail: email }),
          entryCount: count,
        }))
        .sort((a, b) => b.entryCount - a.entryCount)
        .slice(0, 10)

      // Fill in missing keys with 0
      const allActions: AuditAction[] = [
        'progress_update',
        'milestone_advance',
        'day_advance',
        'day_complete',
        'exercise_complete',
        'program_enroll',
        'program_complete',
        'session_start',
        'session_end',
        'data_export',
        'data_import',
        'rollback',
        'validation_failure',
        'concurrent_update_conflict',
        'system_maintenance',
      ]

      const completeEntriesByAction: Record<AuditAction, number> = {} as any
      allActions.forEach((action) => {
        completeEntriesByAction[action] = entriesByAction[action] || 0
      })

      return {
        totalEntries: entries.length,
        entriesByAction: completeEntriesByAction,
        entriesByStatus: {
          success: entriesByStatus.success || 0,
          failure: entriesByStatus.failure || 0,
          partial: entriesByStatus.partial || 0,
        },
        entriesBySource: {
          web_app: entriesBySource.web_app || 0,
          mobile_app: entriesBySource.mobile_app || 0,
          api: entriesBySource.api || 0,
          system: entriesBySource.system || 0,
        },
        dateRange,
        ...(performanceEntryCount > 0 && {
          averagePerformance: {
            duration: totalDuration / performanceEntryCount,
            queryCount: totalQueryCount / performanceEntryCount,
          },
        }),
        topUsers,
        errorRate: entries.length > 0 ? (errorCount / entries.length) * 100 : 0,
        validationWarningRate: entries.length > 0 ? (warningCount / entries.length) * 100 : 0,
      }
    } catch (error) {
      console.error('Failed to get audit stats:', error)
      throw error
    }
  }

  /**
   * Export audit data for compliance or analysis
   */
  async exportAuditData(
    query: AuditQuery,
    format: 'json' | 'csv' = 'json',
  ): Promise<{
    data: string
    filename: string
    contentType: string
  }> {
    try {
      const { entries } = await this.queryAuditEntries({
        ...query,
        limit: 10000, // Export all matching entries
      })

      // Create audit entry for the export action
      await this.createAuditEntry(
        'data_export',
        'user_progress',
        query.userId || 'system',
        { before: {}, after: { exportedEntries: entries.length } },
        { source: 'web_app' },
        { feature: 'audit_export' },
      )

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

      if (format === 'csv') {
        const csvHeaders = [
          'ID',
          'Timestamp',
          'User ID',
          'User Email',
          'Action',
          'Entity Type',
          'Entity ID',
          'Status',
          'Source',
          'Program ID',
          'Error Message',
        ].join(',')

        const csvRows = entries.map((entry) =>
          [
            entry.id,
            entry.timestamp,
            entry.userId,
            entry.userEmail || '',
            entry.action,
            entry.entityType,
            entry.entityId,
            entry.status,
            entry.metadata.source,
            entry.metadata.programId || '',
            (entry.errorMessage || '').replace(/,/g, ';'), // Escape commas
          ].join(','),
        )

        const csvData = [csvHeaders, ...csvRows].join('\n')

        return {
          data: csvData,
          filename: `audit-export-${timestamp}.csv`,
          contentType: 'text/csv',
        }
      } else {
        return {
          data: JSON.stringify(entries, null, 2),
          filename: `audit-export-${timestamp}.json`,
          contentType: 'application/json',
        }
      }
    } catch (error) {
      console.error('Failed to export audit data:', error)
      throw error
    }
  }

  /**
   * Clean up old audit entries (for data retention compliance)
   */
  async cleanupOldEntries(retentionDays: number = 365): Promise<{
    deletedCount: number
    error?: string
  }> {
    try {
      if (!this.payload) {
        await this.initialize()
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      // Find old audit entries
      const oldEntries = await this.payload.find({
        collection: 'exerciseCompletions',
        where: {
          and: [
            { exercise: { like: 'audit-%' } },
            { completedAt: { less_than: cutoffDate.toISOString() } },
          ],
        },
        limit: 1000,
      })

      let deletedCount = 0
      for (const entry of oldEntries.docs || []) {
        try {
          await this.payload.delete({
            collection: 'exerciseCompletions',
            id: entry.id,
          })
          deletedCount++
        } catch (deleteError) {
          console.warn(`Failed to delete audit entry ${entry.id}:`, deleteError)
        }
      }

      // Create audit entry for cleanup action
      await this.createAuditEntry(
        'system_maintenance',
        'user_progress',
        'system',
        {
          before: { totalEntries: oldEntries.totalDocs },
          after: { deletedEntries: deletedCount },
        },
        { source: 'system' },
        { feature: 'audit_cleanup' },
      )

      return { deletedCount }
    } catch (error) {
      console.error('Failed to cleanup old audit entries:', error)
      return {
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Calculate diff between before and after states
   */
  private calculateDiff(
    before: Record<string, any>,
    after: Record<string, any>,
  ): Record<string, any> {
    const diff: Record<string, any> = {}

    // Find changed, added, and removed keys
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

    for (const key of allKeys) {
      const beforeValue = before[key]
      const afterValue = after[key]

      if (beforeValue !== afterValue) {
        diff[key] = {
          from: beforeValue,
          to: afterValue,
        }
      }
    }

    return diff
  }

  /**
   * Encode audit metadata for storage in weight field
   */
  private encodeAuditMetadata(metadata: {
    action: AuditAction
    entityType: AuditEntry['entityType']
    status: AuditEntry['status']
    source: AuditEntry['metadata']['source']
  }): number {
    // Simple encoding scheme for quick filtering
    // This is a workaround until we have a dedicated audit collection
    const actionCode = this.getActionCode(metadata.action)
    const statusCode = metadata.status === 'success' ? 1 : metadata.status === 'failure' ? 2 : 3
    const sourceCode = this.getSourceCode(metadata.source)

    // Encode as: AAAASSCC (Action=4 digits, Status=2 digits, Source=2 digits)
    return actionCode * 10000 + statusCode * 100 + sourceCode
  }

  private getActionCode(action: AuditAction): number {
    const actionCodes: Record<AuditAction, number> = {
      progress_update: 1,
      milestone_advance: 2,
      day_advance: 3,
      day_complete: 4,
      exercise_complete: 5,
      program_enroll: 6,
      program_complete: 7,
      session_start: 8,
      session_end: 9,
      data_export: 10,
      data_import: 11,
      rollback: 12,
      validation_failure: 13,
      concurrent_update_conflict: 14,
      system_maintenance: 15,
    }
    return actionCodes[action] || 99
  }

  private getSourceCode(source: AuditEntry['metadata']['source']): number {
    const sourceCodes = {
      web_app: 1,
      mobile_app: 2,
      api: 3,
      system: 4,
    }
    return sourceCodes[source] || 9
  }
}

// Global audit manager instance
let globalAuditManager: AuditTrailManager | null = null

/**
 * Get or create the global audit trail manager instance
 */
export async function getAuditTrailManager(): Promise<AuditTrailManager> {
  if (!globalAuditManager) {
    globalAuditManager = new AuditTrailManager()
    await globalAuditManager.initialize()
  }
  return globalAuditManager
}

/**
 * Quick function to create an audit entry
 */
export async function createAuditEntry(
  action: AuditAction,
  entityType: AuditEntry['entityType'],
  entityId: string,
  changes: AuditEntry['changes'],
  metadata?: Partial<AuditEntry['metadata']>,
  context?: Partial<AuditEntry['context']>,
  status?: AuditEntry['status'],
  options?: {
    errorMessage?: string
    validationWarnings?: string[]
    performanceMetrics?: AuditEntry['performanceMetrics']
  },
): Promise<string | null> {
  const auditManager = await getAuditTrailManager()
  return auditManager.createAuditEntry(
    action,
    entityType,
    entityId,
    changes,
    metadata,
    context,
    status,
    options,
  )
}

/**
 * Quick function to query audit entries
 */
export async function queryAuditEntries(query: AuditQuery): Promise<{
  entries: AuditEntry[]
  totalCount: number
  hasMore: boolean
}> {
  const auditManager = await getAuditTrailManager()
  return auditManager.queryAuditEntries(query)
}

/**
 * Quick function to get audit statistics
 */
export async function getAuditStats(
  userId?: string,
  programId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<AuditStats> {
  const auditManager = await getAuditTrailManager()
  return auditManager.getAuditStats(userId, programId, dateFrom, dateTo)
}
